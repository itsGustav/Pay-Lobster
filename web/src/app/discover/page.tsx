'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useRegisteredAgents } from '@/hooks/useRegisteredAgents';
import Link from 'next/link';

type FilterType = 'all' | 'premium' | 'elite';

export default function DiscoverPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  
  const { agents, isLoading, error } = useRegisteredAgents();

  const filteredAgents = agents
    .filter((agent) => {
      const matchesSearch =
        agent.name.toLowerCase().includes(search.toLowerCase()) ||
        agent.description.toLowerCase().includes(search.toLowerCase());
      
      const matchesFilter =
        filter === 'all' ||
        (filter === 'elite' && agent.score >= 750) ||
        (filter === 'premium' && agent.score >= 600 && agent.score < 750);

      return matchesSearch && matchesFilter;
    });

  const getScoreBadge = (score: number) => {
    if (score >= 750) return <Badge variant="success">Elite</Badge>;
    if (score >= 600) return <Badge variant="warning">Premium</Badge>;
    return <Badge>Standard</Badge>;
  };

  return (
    <div className="min-h-screen py-16 md:py-24 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-2xl md:text-4xl font-bold mb-4">
            Discover Agents
          </h1>
          <p className="text-lg md:text-xl text-gray-400">
            Browse verified AI agents with proven reputation
          </p>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4 mb-8">
          <Input
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { id: 'all' as FilterType, label: 'All Agents' },
              { id: 'elite' as FilterType, label: 'Elite (750+)' },
              { id: 'premium' as FilterType, label: 'Premium (600+)' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors min-h-touch ${
                  filter === f.id
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-900 text-gray-400 hover:text-gray-50 border border-gray-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card className="text-center py-12">
            <div className="text-4xl mb-4 animate-pulse">🔄</div>
            <p className="text-gray-400">Loading agents from blockchain...</p>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="text-center py-12">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-gray-400 mb-2">Error loading agents</p>
            <p className="text-sm text-gray-500">{error.message}</p>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredAgents.length === 0 && (
          <Card className="text-center py-12">
            <div className="text-4xl mb-4">🦞</div>
            <h3 className="text-xl font-bold mb-2">No Agents Yet</h3>
            <p className="text-gray-400 mb-6">
              {agents.length === 0 
                ? 'Be the first to register an agent!' 
                : 'No agents match your search'}
            </p>
            <Link href="/dashboard">
              <button className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition">
                Register Your Agent
              </button>
            </Link>
          </Card>
        )}

        {/* Agent Grid */}
        {!isLoading && !error && filteredAgents.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <Card key={agent.id} hover className="cursor-pointer space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{agent.name}</h3>
                    <p className="text-sm text-gray-400 font-mono">{agent.address}</p>
                  </div>
                  {getScoreBadge(agent.score)}
                </div>

                <p className="text-sm text-gray-400">{agent.description}</p>

                <div className="space-y-2 pt-4 border-t border-gray-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">LOBSTER Score</span>
                    <span className="font-bold">{agent.score}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Trust Rating</span>
                    <span className="font-bold text-green-500">{agent.trustPercent}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Transactions</span>
                    <span className="font-bold">{agent.transactions}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
