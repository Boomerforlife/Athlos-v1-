import React, { useState, useEffect, useMemo } from 'react';
import type { Screen } from '../types';
import { ChevronLeftIcon, SearchIcon } from '../components/icons';
import { apiService, LeaderboardEntry } from '../src/services/api';
import { websocketService } from '../src/services/websocket';
import { Avatar } from '../components/Avatar';

interface LeaderboardScreenProps {
  onNavigate: (screen: Screen) => void;
  user: any;
}

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ onNavigate, user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'all-time'>('daily');

  const filteredUsers = useMemo(() => {
    return leaderboardData.filter(entry =>
      entry.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [leaderboardData, searchTerm]);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setIsLoading(true);
        
        // Fake leaderboard data for MVP demo
        const baseFakeData = [
          {
            userId: 1,
            name: "Madhavi",
            avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
            totalSteps: 12500,
            rank: 1,
            totalDistance: 8.2,
            territoriesClaimed: 3
          },
          {
            userId: 2,
            name: "Rohan",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
            totalSteps: 11800,
            rank: 2,
            totalDistance: 7.8,
            territoriesClaimed: 2
          },
          {
            userId: 3,
            name: "Ridhi",
            avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
            totalSteps: 10900,
            rank: 3,
            totalDistance: 7.1,
            territoriesClaimed: 2
          },
          {
            userId: 4,
            name: "Devyanshi",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
            totalSteps: 9750,
            rank: 4,
            totalDistance: 6.4,
            territoriesClaimed: 1
          },
          {
            userId: 5,
            name: "Arjun",
            avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
            totalSteps: 8900,
            rank: 5,
            totalDistance: 5.8,
            territoriesClaimed: 1
          }
        ];

        let data: LeaderboardEntry[];
        
        switch (activeTab) {
          case 'daily':
            data = baseFakeData;
            break;
          case 'weekly':
            // Multiply by 7 for weekly data
            data = baseFakeData.map(entry => ({
              ...entry,
              totalSteps: entry.totalSteps * 7,
              totalDistance: entry.totalDistance ? entry.totalDistance * 7 : undefined
            }));
            break;
          case 'all-time':
            // Multiply by 30 for all-time data
            data = baseFakeData.map(entry => ({
              ...entry,
              totalSteps: entry.totalSteps * 30,
              totalDistance: entry.totalDistance ? entry.totalDistance * 30 : undefined
            }));
            break;
          default:
            data = baseFakeData;
        }
        
        setLeaderboardData(data);
      } catch (error) {
        console.error('Error loading leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLeaderboard();
  }, [activeTab]);

  useEffect(() => {
    // Connect to WebSocket for real-time updates
    websocketService.connect().then(() => {
      websocketService.subscribeToDailyLeaderboard((data) => {
        if (activeTab === 'daily') {
          setLeaderboardData(data);
        }
      });
      websocketService.subscribeToWeeklyLeaderboard((data) => {
        if (activeTab === 'weekly') {
          setLeaderboardData(data);
        }
      });
      websocketService.subscribeToAllTimeLeaderboard((data) => {
        if (activeTab === 'all-time') {
          setLeaderboardData(data);
        }
      });
    }).catch((error) => {
      console.error('Leaderboard WebSocket connection failed:', error);
    });

    return () => {
      websocketService.disconnect();
    };
  }, [activeTab]);

  const getMedalSymbol = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };
  
  const getRankClass = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-orange-400';
    return 'text-gray-500';
  };

  return (
    <div className="flex flex-col h-full text-white bg-[#0F172A]">
      <header className="relative flex justify-center items-center p-6 pt-12 border-b border-slate-800">
        <button onClick={() => onNavigate('home')} className="absolute left-6 top-1/2 -translate-y-1/2 mt-6 p-2">
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Leaderboard</h1>
      </header>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex-1 py-3 px-4 text-sm font-medium ${
            activeTab === 'daily' 
              ? 'text-red-400 border-b-2 border-red-400' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Daily
        </button>
        <button
          onClick={() => setActiveTab('weekly')}
          className={`flex-1 py-3 px-4 text-sm font-medium ${
            activeTab === 'weekly' 
              ? 'text-red-400 border-b-2 border-red-400' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Weekly
        </button>
        <button
          onClick={() => setActiveTab('all-time')}
          className={`flex-1 py-3 px-4 text-sm font-medium ${
            activeTab === 'all-time' 
              ? 'text-red-400 border-b-2 border-red-400' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          All Time
        </button>
      </div>

      <div className="p-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for a player..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-4 pl-12 bg-slate-800 rounded-lg border border-transparent focus:border-red-500 focus:ring-red-500 transition"
          />
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
        </div>
      </div>

      <main className="flex-grow overflow-y-auto px-6 pb-6">
        {isLoading ? (
          <div className="text-center py-10">
            <div className="loading-spinner mb-4"></div>
            <p className="text-gray-400">Loading leaderboard...</p>
          </div>
        ) : filteredUsers.length > 0 ? (
          <ul className="space-y-2">
            {filteredUsers.map((entry) => (
              <li key={entry.userId} className="flex items-center p-3 bg-slate-800 rounded-lg hover:bg-slate-700/50 transition">
                <span className={`w-8 text-center text-lg font-bold ${getRankClass(entry.rank)}`}>
                  {entry.rank}
                </span>
                <div className="mx-4">
                  <Avatar name={entry.name} size={40} />
                </div>
                <div className="flex-grow">
                  <span className="font-semibold">{entry.name}</span>
                  <span className="text-lg ml-2">{getMedalSymbol(entry.rank)}</span>
                </div>
                <span className="text-gray-300 font-medium">{entry.totalSteps.toLocaleString()} steps</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-400">No players found.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default LeaderboardScreen;
