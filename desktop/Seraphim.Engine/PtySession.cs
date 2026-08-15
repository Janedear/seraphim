using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;

namespace Seraphim.Engine;

public sealed class PtySession : IDisposable
{
    private static readonly Regex Ansi = new(@"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~]|\].*?(?:\x07|\x1B\\))",
        RegexOptions.Compiled);

    private readonly IntPtr _hPC;
    private readonly IntPtr _hIn;
    private readonly IntPtr _hOut;
    private IntPtr _hProcess;
    private IntPtr _hThread;
    private readonly StringBuilder _captured = new();
    private readonly TaskCompletionSource _exited = new(TaskCreationOptions.RunContinuationsAsynchronously);
    private readonly TaskCompletionSource _readDone = new(TaskCreationOptions.RunContinuationsAsynchronously);
    private Action<string>? _output;
    private bool _disposed;
    private int _pcClosed;
    private int _readError;

    public string Debug => $"captured={_captured.Length} readErr={_readError} exited={_exited.Task.IsCompleted} readDone={_readDone.Task.IsCompleted}";

    private PtySession(IntPtr hPC, IntPtr hIn, IntPtr hOut, IntPtr hProcess, IntPtr hThread)
    {
        _hPC = hPC;
        _hIn = hIn;
        _hOut = hOut;
        _hProcess = hProcess;
        _hThread = hThread;
        Task.Factory.StartNew(ReadLoop, TaskCreationOptions.LongRunning);
        Task.Factory.StartNew(WaitLoop, TaskCreationOptions.LongRunning);
    }

    public bool Alive => !_exited.Task.IsCompleted && !_disposed;

    public event Action<string>? Output
    {
        add
        {
            _output += value;
            string snap;
            lock (_captured) snap = _captured.ToString();
            if (snap.Length > 0)
                value?.Invoke(snap);
        }
        remove => _output -= value;
    }

    public static string StripAnsi(string text)
    {
        if (string.IsNullOrEmpty(text)) return text;
        return Ansi.Replace(text, "").Replace("\r", "");
    }

    public static PtySession Start(string fileName, IReadOnlyList<string> arguments, short cols = 120, short rows = 32)
    {
        if (!CreatePipe(out var ptyInRead, out var ourWrite, IntPtr.Zero, 0))
            throw new InvalidOperationException("CreatePipe input failed: " + Marshal.GetLastWin32Error());

        if (!CreatePipe(out var ourRead, out var ptyOutWrite, IntPtr.Zero, 0))
            throw new InvalidOperationException("CreatePipe output failed: " + Marshal.GetLastWin32Error());

        var size = new Coord { X = cols, Y = rows };
        var hr = CreatePseudoConsole(size, ptyInRead, ptyOutWrite, 0, out var hPC);
        if (hr != 0)
            throw new InvalidOperationException("CreatePseudoConsole failed: 0x" + hr.ToString("x"));

        CloseHandle(ptyInRead);
        CloseHandle(ptyOutWrite);

        var si = new StartupInfoEx();
        si.StartupInfo.cb = Marshal.SizeOf<StartupInfoEx>();
        var attrSize = IntPtr.Zero;
        InitializeProcThreadAttributeList(IntPtr.Zero, 1, 0, ref attrSize);
        si.lpAttributeList = Marshal.AllocHGlobal(attrSize);
        if (!InitializeProcThreadAttributeList(si.lpAttributeList, 1, 0, ref attrSize))
            throw new InvalidOperationException("InitializeProcThreadAttributeList failed: " + Marshal.GetLastWin32Error());
        if (!UpdateProcThreadAttribute(si.lpAttributeList, 0, (IntPtr)ProcThreadAttributePseudoconsole, hPC,
                (IntPtr)IntPtr.Size, IntPtr.Zero, IntPtr.Zero))
            throw new InvalidOperationException("UpdateProcThreadAttribute failed: " + Marshal.GetLastWin32Error());

        var cmd = new StringBuilder(CommandLine(fileName, arguments));
        if (!CreateProcessW(fileName, cmd, IntPtr.Zero, IntPtr.Zero, false,
                ExtendedStartupinfoPresent, IntPtr.Zero, null, ref si, out var pi))
        {
            var err = Marshal.GetLastWin32Error();
            DeleteProcThreadAttributeList(si.lpAttributeList);
            Marshal.FreeHGlobal(si.lpAttributeList);
            throw new InvalidOperationException("CreateProcess failed: " + err + " (" + cmd + ")");
        }

        DeleteProcThreadAttributeList(si.lpAttributeList);
        Marshal.FreeHGlobal(si.lpAttributeList);
        return new PtySession(hPC, ourWrite, ourRead, pi.hProcess, pi.hThread);
    }

    public void Write(string text)
    {
        if (_disposed || string.IsNullOrEmpty(text)) return;
        var bytes = Encoding.UTF8.GetBytes(text);
        WriteFile(_hIn, bytes, bytes.Length, out _, IntPtr.Zero);
    }

    public async Task<string> ReadUntilExitAsync(TimeSpan timeout)
    {
        using var cts = new CancellationTokenSource(timeout);
        await _exited.Task.WaitAsync(cts.Token);
        await Task.Delay(80, cts.Token);
        ClosePC();
        await _readDone.Task.WaitAsync(cts.Token);
        lock (_captured) return _captured.ToString();
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        try
        {
            if (!_exited.Task.IsCompleted)
                TerminateProcess(_hProcess, 1);
        }
        catch { /* already gone */ }
        ClosePC();
        CloseHandle(_hIn);
        CloseHandle(_hOut);
        CloseHandle(_hProcess);
        CloseHandle(_hThread);
        _exited.TrySetResult();
        _readDone.TrySetResult();
    }

    private void ReadLoop()
    {
        var buf = new byte[4096];
        try
        {
            while (!_disposed)
            {
                if (!ReadFile(_hOut, buf, buf.Length, out var n, IntPtr.Zero) || n == 0)
                {
                    _readError = Marshal.GetLastWin32Error();
                    break;
                }
                var chunk = StripAnsi(Decode(buf, n));
                if (chunk.Length == 0) continue;
                lock (_captured) _captured.Append(chunk);
                _output?.Invoke(chunk);
            }
        }
        catch { /* pipe closed */ }
        finally
        {
            _readDone.TrySetResult();
        }
    }

    private void WaitLoop()
    {
        if (_hProcess == IntPtr.Zero) return;
        WaitForSingleObject(_hProcess, 0xFFFFFFFF);
        _exited.TrySetResult();
    }

    private void ClosePC()
    {
        if (Interlocked.Exchange(ref _pcClosed, 1) == 0 && _hPC != IntPtr.Zero)
            ClosePseudoConsole(_hPC);
    }

    private static string Decode(byte[] buf, int n)
    {
        if (n >= 2 && buf[1] == 0)
            return Encoding.Unicode.GetString(buf, 0, n);
        return Encoding.UTF8.GetString(buf, 0, n);
    }

    public static string CommandLine(string fileName, IReadOnlyList<string> arguments)
    {
        var sb = new StringBuilder();
        sb.Append(Quote(fileName));
        foreach (var a in arguments)
        {
            sb.Append(' ');
            sb.Append(Quote(a));
        }
        return sb.ToString();
    }

    private static string Quote(string value)
    {
        if (value.Length > 0 && value.IndexOfAny([' ', '\t', '"']) < 0)
            return value;
        return "\"" + value.Replace("\"", "\\\"") + "\"";
    }

    private const uint ExtendedStartupinfoPresent = 0x00080000;
    private const int ProcThreadAttributePseudoconsole = 0x00020016;

    [StructLayout(LayoutKind.Sequential)]
    private struct Coord
    {
        public short X;
        public short Y;
    }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private struct StartupInfo
    {
        public int cb;
        public IntPtr lpReserved;
        public IntPtr lpDesktop;
        public IntPtr lpTitle;
        public int dwX, dwY, dwXSize, dwYSize, dwXCountChars, dwYCountChars, dwFillAttribute, dwFlags;
        public short wShowWindow, cbReserved2;
        public IntPtr lpReserved2, hStdInput, hStdOutput, hStdError;
    }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private struct StartupInfoEx
    {
        public StartupInfo StartupInfo;
        public IntPtr lpAttributeList;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct ProcessInformation
    {
        public IntPtr hProcess;
        public IntPtr hThread;
        public int dwProcessId;
        public int dwThreadId;
    }

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern int CreatePseudoConsole(Coord size, IntPtr hInput, IntPtr hOutput, uint dwFlags, out IntPtr phPC);

    [DllImport("kernel32.dll")]
    private static extern void ClosePseudoConsole(IntPtr hPC);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool InitializeProcThreadAttributeList(IntPtr lpAttributeList, int dwAttributeCount, int dwFlags, ref IntPtr lpSize);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool UpdateProcThreadAttribute(IntPtr lpAttributeList, uint dwFlags, IntPtr attribute, IntPtr lpValue, IntPtr cbSize, IntPtr lpPreviousValue, IntPtr lpReturnSize);

    [DllImport("kernel32.dll")]
    private static extern void DeleteProcThreadAttributeList(IntPtr lpAttributeList);

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern bool CreateProcessW(string? lpApplicationName, StringBuilder lpCommandLine, IntPtr lpProcessAttributes, IntPtr lpThreadAttributes, bool bInheritHandles, uint dwCreationFlags, IntPtr lpEnvironment, string? lpCurrentDirectory, ref StartupInfoEx lpStartupInfo, out ProcessInformation lpProcessInformation);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool CreatePipe(out IntPtr hReadPipe, out IntPtr hWritePipe, IntPtr lpPipeAttributes, uint nSize);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool ReadFile(IntPtr hFile, byte[] lpBuffer, int nNumberOfBytesToRead, out int lpNumberOfBytesRead, IntPtr lpOverlapped);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool WriteFile(IntPtr hFile, byte[] lpBuffer, int nNumberOfBytesToWrite, out int lpNumberOfBytesWritten, IntPtr lpOverlapped);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool CloseHandle(IntPtr hObject);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern uint WaitForSingleObject(IntPtr hHandle, uint dwMilliseconds);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool TerminateProcess(IntPtr hProcess, uint uExitCode);
}
