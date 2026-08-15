const isNode = typeof window === 'undefined';
const windowObj = isNode ? { localStorage: new Map() } : window;
const storage = windowObj.localStorage;

const toSnakeCase = (str) => {
	return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
	if (isNode) {
		return defaultValue;
	}
	const storageKey = `base44_${toSnakeCase(paramName)}`;
	const urlParams = new URLSearchParams(window.location.search);
	const searchParam = urlParams.get(paramName);
	if (removeFromUrl) {
		urlParams.delete(paramName);
		const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""
			}${window.location.hash}`;
		window.history.replaceState({}, document.title, newUrl);
	}
	if (searchParam) {
		storage.setItem(storageKey, searchParam);
		return searchParam;
	}
	if (defaultValue) {
		storage.setItem(storageKey, defaultValue);
		return defaultValue;
	}
	const storedValue = storage.getItem(storageKey);
	if (storedValue) {
		return storedValue;
	}
	return null;
}

const sanitizeUrl = (url) => {
	if (!url || typeof url !== 'string') return null;
	const trimmed = url.trim();
	if (!trimmed) return null;
	try {
		const u = new URL(trimmed);
		if (!['http:', 'https:'].includes(u.protocol)) return null;
		return u.toString();
	} catch {
		return null;
	}
};

const sanitizeAppId = (id) => {
	if (!id || typeof id !== 'string') return null;
	const trimmed = id.trim();
	return /^[a-zA-Z0-9_-]+$/.test(trimmed) ? trimmed : null;
};

/**
 * Validate config for production. Returns { valid, errors }.
 */
export const validateConfig = (params = {}) => {
	const errors = [];
	const appId = params.appId ?? getAppParams().appId;
	const appBaseUrl = params.appBaseUrl ?? getAppParams().appBaseUrl;

	if (!appId) {
		errors.push('App ID is required');
	} else if (!sanitizeAppId(appId)) {
		errors.push('App ID contains invalid characters');
	}
	if (appBaseUrl && !sanitizeUrl(appBaseUrl)) {
		errors.push('API base URL must be a valid https URL');
	}

	return {
		valid: errors.length === 0,
		errors,
	};
};

const getAppParams = () => {
	if (getAppParamValue("clear_access_token") === 'true') {
		storage.removeItem('base44_access_token');
		storage.removeItem('token');
	}
	const raw = {
		appId: getAppParamValue("app_id", { defaultValue: import.meta.env.VITE_APP_ID || import.meta.env.VITE_BASE44_APP_ID || 'preview-demo' }),
		token: getAppParamValue("access_token", { removeFromUrl: true }),
		fromUrl: getAppParamValue("from_url", { defaultValue: isNode ? null : window.location.href }),
		functionsVersion: getAppParamValue("functions_version", { defaultValue: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION }),
		appBaseUrl: getAppParamValue("app_base_url", { defaultValue: import.meta.env.VITE_BASE44_APP_BASE_URL || import.meta.env.VITE_APP_BASE_URL || 'https://preview-demo.base44.app' }),
	};
	return {
		...raw,
		appId: raw.appId || 'preview-demo',
		appBaseUrl: sanitizeUrl(raw.appBaseUrl) || raw.appBaseUrl || 'https://preview-demo.base44.app',
	};
};

export const appParams = {
	...getAppParams()
}
