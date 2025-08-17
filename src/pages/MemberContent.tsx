/**
 * Member Content page (Airtable-free)
 * - Purpose: Show available programs from local static data.
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { BookOpen, FileText, Play, Zap, Award, Loader2 } from 'lucide-react';
import Breadcrumbs from '../components/common/Breadcrumbs';
import SafeText from '../components/common/SafeText';

/** Program data from API */
interface ProgramData {
  slug: string;
  name: string;
  description: string;
  level?: string;
}

/** UI type for program card */
interface ProgramUIItem {
  id: string;
  title: string;
  description: string;
  level?: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

/** Visual mapping helper */
function getProgramVisuals(level?: string) {
  const lower = (level || '').toLowerCase();
  if (lower.includes('advanced') || lower.includes('expert')) return { color: 'from-blue-600 via-cyan-500 to-teal-300', icon: Zap };
  if (lower.includes('intermediate')) return { color: 'from-blue-600 via-cyan-500 to-teal-300', icon: Award };
  return { color: 'from-blue-600 via-cyan-500 to-teal-300', icon: FileText };
}

export default function MemberContent() {
  const [programs, setPrograms] = useState<ProgramData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrograms() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/clinical-programs');
        if (!response.ok) {
          throw new Error(`Failed to fetch programs: ${response.status}`);
        }
        const data = await response.json();
        setPrograms(data.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load programs');
        console.error('Error fetching programs:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPrograms();
  }, []);

  const programUIItems: ProgramUIItem[] = useMemo(
    () =>
      programs.map((p) => {
        const visuals = getProgramVisuals(p.level);
        return { 
          id: p.slug, 
          title: p.name, 
          description: p.description, 
          level: p.level, 
          color: visuals.color, 
          icon: visuals.icon 
        };
      }),
    [programs]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Page Header */}
      <section className="bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-300 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Breadcrumbs
              variant="light"
              items={[
                { label: 'Dashboard', to: '/dashboard' },
                { label: 'Clinical Programs' },
              ]}
              className="mb-4"
            />
            <h1 className="text-4xl font-bold mb-2">Member Content</h1>
            <p className="text-lg text-white/90">Access your clinical training programs and resources</p>
          </div>
        </div>
      </section>

      {/* Quick Resources */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-300 border-cyan-400">
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-300 rounded-full flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Resource Library</h3>
                    <p className="text-gray-600">Access clinical tools, forms, and educational materials</p>
                  </div>
                </div>
                <Link to="/resources">
                  <Button className="bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-300 hover:opacity-90">
                    <BookOpen className="h-4 w-4 mr-2" />
                    View Resources
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading programs...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-600 mb-4">Error loading programs</div>
                <div className="text-gray-600">{error}</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {programUIItems.map((program) => {
                  const Icon = program.icon;
                  const to = `/program/${program.id}`;
                  return (
                    <Card key={program.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                      <div className={`h-2 bg-gradient-to-r ${program.color}`}></div>
                      <CardHeader>
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${program.color} flex items-center justify-center`}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          {program.level ? (
                            <div className="flex gap-2">
                              <Badge variant="secondary" className="text-xs">
                                <SafeText value={program.level} />
                              </Badge>
                            </div>
                          ) : null}
                        </div>
                        <CardTitle className="text-xl mb-2">
                          <SafeText value={program.title} />
                        </CardTitle>
                        {program.description ? (
                          <CardDescription className="text-gray-600 mb-4">
                            <SafeText value={program.description} />
                          </CardDescription>
                        ) : null}
                      </CardHeader>

                      <CardContent>
                        <div className="flex gap-3">
                          <Link to={to} className="flex-1">
                            <Button className={`w-full bg-gradient-to-r ${program.color} hover:opacity-90`}>
                              <Play className="h-4 w-4 mr-2" />
                              View Program
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
