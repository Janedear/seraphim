import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap,
  Target,
  Trophy,
  Star,
  Lock,
  CheckCircle2,
  PlayCircle,
  BookOpen,
  Code,
  Shield,
  Zap,
  Award
} from "lucide-react";
import { useAuth } from '@/lib/AuthContext';
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CourseCard = ({ course, onStart, team }) => {
  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-blue-100 text-blue-800',
    advanced: 'bg-purple-100 text-purple-800',
    expert: 'bg-red-100 text-red-800'
  };

  return (
    <Card className={cn('bg-black/40 backdrop-blur-md transition-all', team === 'blue' ? 'border-cyan-500/30 hover:shadow-[0_0_30px_rgba(0,186,255,0.2)]' : 'border-red-500/30 hover:shadow-[0_0_30px_rgba(255,50,50,0.2)]', course.locked ? 'opacity-60' : '')}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-2">
          <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', team === 'blue' ? 'bg-cyan-500/20 border border-cyan-500/30' : 'bg-red-500/20 border border-red-500/30')}>
            <course.icon className={cn('w-6 h-6', team === 'blue' ? 'text-cyan-400' : 'text-red-400')} />
          </div>
          {course.locked && (
            <Badge variant="outline" className={cn('flex items-center gap-1', team === 'blue' ? 'border-cyan-500/30 text-cyan-400' : 'border-red-500/30 text-red-400')}>
              <Lock className="w-3 h-3" /> Locked
            </Badge>
          )}
          {course.completed && (
            <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Completed
            </Badge>
          )}
        </div>
        <CardTitle className="text-base text-white">{course.title}</CardTitle>
        <CardDescription className={cn('text-xs', team === 'blue' ? 'text-cyan-200/70' : 'text-red-200/70')}>{course.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs">
            <Badge className={difficultyColors[course.difficulty]}>
              {course.difficulty}
            </Badge>
            <span className="text-slate-500">{course.duration}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-500">{course.xp} XP</span>
          </div>

          {course.progress > 0 && !course.completed && (
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-600">Progress</span>
                <span className="font-medium">{course.progress}%</span>
              </div>
              <Progress value={course.progress} className="h-2" />
            </div>
          )}

          <Button
            className="w-full"
            size="sm"
            disabled={course.locked}
            onClick={() => onStart(course.id)}
          >
            {course.completed ? (
              <>
                <Trophy className="w-3 h-3 mr-2" />
                Review Course
              </>
            ) : course.progress > 0 ? (
              <>
                <PlayCircle className="w-3 h-3 mr-2" />
                Continue
              </>
            ) : (
              <>
                <PlayCircle className="w-3 h-3 mr-2" />
                Start Course
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const AchievementBadge = ({ achievement }) => {
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg bg-gradient-to-br from-amber-50 to-yellow-50">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center flex-shrink-0">
        <Trophy className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm">{achievement.title}</p>
        <p className="text-xs text-slate-600">{achievement.description}</p>
        <p className="text-xs text-amber-600 mt-1">+{achievement.xp} XP</p>
      </div>
    </div>
  );
};

export default function SecurityAcademy() {
  const { user } = useAuth();
  const team = user?.team || 'blue';
  const [userLevel] = useState(5);
  const [totalXP] = useState(2340);
  const [nextLevelXP] = useState(3000);

  const courses = [
    {
      id: '1',
      title: 'Honeypot Fundamentals',
      description: 'Learn what honeypots are, why they work, and how to deploy your first decoy system',
      difficulty: 'beginner',
      duration: '30 min',
      xp: 100,
      icon: Target,
      locked: false,
      completed: true,
      progress: 100
    },
    {
      id: '2',
      title: 'Reading Attack Logs',
      description: 'Understand attacker behavior by analyzing honeypot logs and identifying patterns',
      difficulty: 'beginner',
      duration: '45 min',
      xp: 150,
      icon: BookOpen,
      locked: false,
      completed: false,
      progress: 65
    },
    {
      id: '3',
      title: 'OSINT Techniques',
      description: 'Master open-source intelligence gathering: IP geolocation, WHOIS, social media',
      difficulty: 'intermediate',
      duration: '1 hour',
      xp: 200,
      icon: Shield,
      locked: false,
      completed: false,
      progress: 30
    },
    {
      id: '4',
      title: 'Attacker Profiling',
      description: 'Build detailed profiles of attackers using behavioral analysis and fingerprinting',
      difficulty: 'intermediate',
      duration: '1.5 hours',
      xp: 250,
      icon: Code,
      locked: false,
      completed: false,
      progress: 0
    },
    {
      id: '5',
      title: 'Advanced Deception',
      description: 'Deploy sophisticated honeynets and honey-tokens to detect insider threats',
      difficulty: 'advanced',
      duration: '2 hours',
      xp: 300,
      icon: Zap,
      locked: true,
      completed: false,
      progress: 0
    },
    {
      id: '6',
      title: 'Counter-Intrusion Operations',
      description: 'Legal methods to trace and reverse-track attackers (for law enforcement)',
      difficulty: 'expert',
      duration: '3 hours',
      xp: 500,
      icon: Shield,
      locked: true,
      completed: false,
      progress: 0
    }
  ];

  const achievements = [
    {
      id: '1',
      title: 'First Catch',
      description: 'Successfully trapped your first attacker in a honeypot',
      xp: 50
    },
    {
      id: '2',
      title: 'OSINT Expert',
      description: 'Completed 10 OSINT investigations',
      xp: 100
    },
    {
      id: '3',
      title: 'Log Master',
      description: 'Analyzed 1000+ honeypot interactions',
      xp: 150
    }
  ];

  const handleStartCourse = (courseId) => {
    toast.info('Loading interactive course...');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security Academy"
        description="Learn offensive security, attacker tracking, and OSINT - gamified for beginners"
      />

      {/* User Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={cn('bg-black/40 backdrop-blur-md border', team === 'blue' ? 'border-cyan-500/30' : 'border-red-500/30')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={cn('w-14 h-14 rounded-full flex items-center justify-center', team === 'blue' ? 'bg-gradient-to-br from-cyan-500 to-cyan-600' : 'bg-gradient-to-br from-red-500 to-red-600')}>
                <Star className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">Level {userLevel}</p>
                <p className={cn('text-sm', team === 'blue' ? 'text-cyan-200/70' : 'text-red-200/70')}>Security Analyst</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className={team === 'blue' ? 'text-cyan-200/70' : 'text-red-200/70'}>XP Progress</span>
                <span className="font-medium text-white">{totalXP} / {nextLevelXP}</span>
              </div>
              <Progress value={(totalXP / nextLevelXP) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className={cn('bg-black/40 backdrop-blur-md border', team === 'blue' ? 'border-cyan-500/30' : 'border-red-500/30')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={cn('w-14 h-14 rounded-full flex items-center justify-center', team === 'blue' ? 'bg-green-500/20 border border-green-500/30' : 'bg-green-500/20 border border-green-500/30')}>
                <CheckCircle2 className="w-7 h-7 text-green-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">1/6</p>
                <p className="text-sm text-slate-400">Courses Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn('bg-black/40 backdrop-blur-md border', team === 'blue' ? 'border-cyan-500/30' : 'border-red-500/30')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={cn('w-14 h-14 rounded-full flex items-center justify-center', team === 'blue' ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-amber-500/20 border border-amber-500/30')}>
                <Trophy className="w-7 h-7 text-amber-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">3</p>
                <p className="text-sm text-slate-400">Achievements Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
          <GraduationCap className="w-5 h-5" />
          Learning Path
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onStart={handleStartCourse}
              team={team}
            />
          ))}
        </div>
      </div>

      {/* Achievements */}
      <Card className={cn('bg-black/40 backdrop-blur-md border', team === 'blue' ? 'border-cyan-500/30' : 'border-red-500/30')}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Award className="w-5 h-5" />
            Recent Achievements
          </CardTitle>
          <CardDescription className={team === 'blue' ? 'text-cyan-200/70' : 'text-red-200/70'}>
            Unlock achievements by practicing security techniques
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {achievements.map((achievement) => (
            <AchievementBadge key={achievement.id} achievement={achievement} />
          ))}
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className={cn('bg-black/40 backdrop-blur-md border', team === 'blue' ? 'border-cyan-500/30' : 'border-red-500/30')}>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', team === 'blue' ? 'bg-cyan-500/20 border border-cyan-500/30' : 'bg-red-500/20 border border-red-500/30')}>
              <Target className={cn('w-5 h-5', team === 'blue' ? 'text-cyan-400' : 'text-red-400')} />
            </div>
            <div>
              <p className="font-semibold text-white mb-1">Your Next Mission</p>
              <p className={cn('text-sm mb-3', team === 'blue' ? 'text-cyan-200/70' : 'text-red-200/70')}>
                Complete "Reading Attack Logs" to learn how attackers think and move. This will help you identify threats faster and build better honeypots.
              </p>
              <Button size="sm" onClick={() => handleStartCourse('2')}>
                <PlayCircle className="w-3 h-3 mr-2" />
                Continue Learning
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}