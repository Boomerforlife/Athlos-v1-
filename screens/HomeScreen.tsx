import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { Screen } from '../types';
import { HomeIcon, ChartIcon, BellIcon, UserIcon, SettingsIcon, LogoutIcon, UserPlusIcon, SearchIcon } from '../components/icons';
import { apiService, LeaderboardEntry, User, Run } from '../src/services/api';
import { websocketService } from '../src/services/websocket';
import { Avatar } from '../components/Avatar';

const LiquidProgress = ({ progress }: { progress: number }) => {
  const uniqueId = "wave-clip-path";
  // The SVG height is 200. Progress will map from 0 to 100.
  // When progress is 0, we want translateY to be 200 (fully hidden at bottom).
  // When progress is 100, we want translateY to be 0 (fully visible at top).
  const yPosition = (100 - progress) * 2; // (100 - progress) / 100 * 200

  return (
    <div className="absolute bottom-0 left-0 w-full h-full">
      <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="none">
        <g style={{ transform: `translateY(${yPosition}px)` }} className="transition-transform duration-1000 ease-in-out">
          {/* Wave 1 - Slower, less opaque */}
          <path
            d="M -400 100 C -300 50, -200 50, -100 100 S 0 150, 100 100 S 200 50, 300 100 S 400 150, 500 100 S 600 50, 700 100 S 800 150, 900 100 V 300 H -400 Z"
            fill="rgba(255, 255, 255, 0.2)"
            className="animate-wave-slow"
          />
          {/* Wave 2 - Faster, more opaque */}
          <path
            d="M -400 110 C -300 60, -200 60, -100 110 S 0 160, 100 110 S 200 60, 300 110 S 400 160, 500 110 S 600 60, 700 110 S 800 160, 900 110 V 300 H -400 Z"
            fill="rgba(255, 255, 255, 0.3)"
            className="animate-wave-fast"
          />
        </g>
      </svg>
    </div>
  );
};

interface HomeScreenProps {
  onNavigate: (screen: Screen) => void;
  user: User | null;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate, user }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [friendSearchTerm, setFriendSearchTerm] = useState('');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [suggestedFriends, setSuggestedFriends] = useState<any[]>([]);
  const [currentSteps, setCurrentSteps] = useState(0);
  const [goalSteps, setGoalSteps] = useState(() => {
    // Initialize from localStorage first, then fallback to user prop, then default
    const storedUser = localStorage.getItem('athlos_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        return parsedUser.dailyStepGoal || user?.dailyStepGoal || 6000;
      } catch (error) {
        console.error('Error parsing stored user data:', error);
      }
    }
    return user?.dailyStepGoal || 6000;
  });
  const [isLoading, setIsLoading] = useState(true);

  const progress = Math.min((currentSteps / goalSteps) * 100, 100);

  const filteredFriends = useMemo(() => {
    return suggestedFriends.filter(friend =>
      friend.name.toLowerCase().includes(friendSearchTerm.toLowerCase())
    );
  }, [friendSearchTerm]);

  // Update goalSteps when user data changes
  useEffect(() => {
    // Check both user prop and localStorage for the most up-to-date goal
    const storedUser = localStorage.getItem('athlos_user');
    let newGoal = user?.dailyStepGoal || 6000;
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.dailyStepGoal) {
          newGoal = parsedUser.dailyStepGoal;
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
      }
    }
    
    console.log('Current goalSteps:', goalSteps, 'New goal from data:', newGoal);
    if (newGoal !== goalSteps) {
      console.log('Updating goal to:', newGoal);
      setGoalSteps(newGoal);
    }
  }, [user?.dailyStepGoal]); // Removed goalSteps from dependency to prevent infinite loop

  // Check localStorage on mount for immediate goal update
  useEffect(() => {
    const storedUser = localStorage.getItem('athlos_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.dailyStepGoal && parsedUser.dailyStepGoal !== goalSteps) {
          console.log('Mount: Updating goal from localStorage:', parsedUser.dailyStepGoal);
          setGoalSteps(parsedUser.dailyStepGoal);
        }
      } catch (error) {
        console.error('Error parsing stored user data on mount:', error);
      }
    }
  }, []); // Run only on mount

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load fake leaderboard data for MVP demo
        const fakeLeaderboardData = [
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
        setLeaderboardData(fakeLeaderboardData);
        
        // Load fake suggested friends data
        const fakeFriendsData = [
          { id: 6, name: "Priya", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face" },
          { id: 7, name: "Karan", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face" },
          { id: 8, name: "Sneha", avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face" },
          { id: 9, name: "Vikram", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face" },
          { id: 10, name: "Ananya", avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop&crop=face" }
        ];
        setSuggestedFriends(fakeFriendsData);
        
        // Calculate user's current steps from today's runs
        if (user && user.id) {
          try {
            const userRuns = await apiService.getUserRuns(user.id);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayRuns = userRuns.filter(run => {
              if (!run.startTime) return false;
              const runDate = new Date(run.startTime);
              runDate.setHours(0, 0, 0, 0);
              return runDate.getTime() === today.getTime();
            });
            const totalStepsToday = todayRuns.reduce((sum, run) => sum + (run.totalSteps || 0), 0);
            setCurrentSteps(totalStepsToday);
          } catch (error) {
            console.error('Error loading user runs:', error);
            setCurrentSteps(0);
          }
        } else {
          setCurrentSteps(0);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Initialize campus map with real territories
  useEffect(() => {
    const container = document.getElementById('home-map');
    if (!container) return;
    // guard against re-init
    if ((container as any)._leaflet_id) return;

    // SRM KTR approximate center
    const SRM_CENTER: [number, number] = [12.8232, 80.0452];
    const SRM_BOUNDS = (window as any).L.latLngBounds([12.8195, 80.0400], [12.8275, 80.0490]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map: any = (window as any).L?.map(container, { maxBounds: SRM_BOUNDS, maxBoundsViscosity: 1.0 }).setView(SRM_CENTER, 16);
    if (!map) return;
    (window as any).L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains:['mt0','mt1','mt2','mt3'],
      attribution: '&copy; Google Maps'
    }).addTo(map);

    // Load fake territories for MVP demo
    const loadTerritories = () => {
      // Fake territories around SRM KTR campus for demo
      const fakeTerritoriesData = [
        {
          name: "Main Campus",
          owner: "Madhavi",
          coordinates: [
            [12.8225, 80.0440],
            [12.8235, 80.0440],
            [12.8235, 80.0450],
            [12.8225, 80.0450]
          ],
          color: '#ef4444'
        },
        {
          name: "Sports Complex",
          owner: "Rohan",
          coordinates: [
            [12.8240, 80.0445],
            [12.8250, 80.0445],
            [12.8250, 80.0455],
            [12.8240, 80.0455]
          ],
          color: '#3b82f6'
        },
        {
          name: "Library Area",
          owner: "Ridhi",
          coordinates: [
            [12.8220, 80.0455],
            [12.8230, 80.0455],
            [12.8230, 80.0465],
            [12.8220, 80.0465]
          ],
          color: '#8b5cf6'
        },
        {
          name: "Hostel Block",
          owner: "Devyanshi",
          coordinates: [
            [12.8245, 80.0435],
            [12.8255, 80.0435],
            [12.8255, 80.0445],
            [12.8245, 80.0445]
          ],
          color: '#f59e0b'
        },
        {
          name: "Food Court",
          owner: "Arjun",
          coordinates: [
            [12.8215, 80.0445],
            [12.8225, 80.0445],
            [12.8225, 80.0455],
            [12.8215, 80.0455]
          ],
          color: '#10b981'
        }
      ];

      fakeTerritoriesData.forEach((territory) => {
        const polygon = (window as any).L.polygon(territory.coordinates, {
          color: territory.color,
          fillColor: territory.color,
          fillOpacity: 0.3,
          weight: 2
        }).addTo(map);
        
        // Add popup with territory info
        polygon.bindPopup(`
          <div style="text-align: center;">
            <strong>${territory.name}</strong><br/>
            <span style="color: ${territory.color};">Claimed by ${territory.owner}</span>
          </div>
        `);
      });
    };
    
    loadTerritories();
  }, []);

  // Disabled WebSocket for MVP demo
  // useEffect(() => {
  //   // Connect to WebSocket for real-time updates
  //   websocketService.connect().then(() => {
  //     websocketService.subscribeToDailyLeaderboard((data) => {
  //       setLeaderboardData(data);
  //     });
  //     websocketService.requestDailyLeaderboard();
  //   });

  //   return () => {
  //     websocketService.disconnect();
  //   };
  // }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const getRankClass = (index: number) => {
    switch (index) {
      case 0: return 'text-yellow-400';
      case 1: return 'text-gray-300';
      case 2: return 'text-orange-400';
      default: return 'text-gray-500';
    }
  };

  const getMedalSymbol = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full text-white bg-[#0F172A]">
        <style>{`
          @keyframes wave-slow {
            0% { transform: translateX(0); }
            100% { transform: translateX(-400px); }
          }
          .animate-wave-slow {
            animation: wave-slow 10s linear infinite;
          }

          @keyframes wave-fast {
            0% { transform: translateX(0); }
            100% { transform: translateX(-400px); }
          }
          .animate-wave-fast {
            animation: wave-fast 6s linear infinite;
          }
        `}</style>
      <header className="flex justify-between items-center p-6 pt-12">
        <div>
          <h1 className="text-2xl font-bold">Home</h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-lg font-semibold">Athlos</span>
          <div className="relative">
            <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="cursor-pointer">
              <Avatar name={user?.name} size={40} />
            </div>
            {isDropdownOpen && (
              <div ref={dropdownRef} className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-lg py-2 z-20 origin-top-right animate-in fade-in-20 slide-in-from-top-2">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onNavigate('profile');
                  }}
                  className="w-full flex items-center text-left px-4 py-2 text-sm text-gray-300 hover:bg-red-600 hover:text-white rounded-t-lg"
                >
                  <UserIcon className="w-5 h-5 mr-3" />
                  Profile
                </button>
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onNavigate('settings');
                  }}
                  className="w-full flex items-center text-left px-4 py-2 text-sm text-gray-300 hover:bg-red-600 hover:text-white"
                >
                  <SettingsIcon className="w-5 h-5 mr-3" />
                  Settings
                </button>
                <div className="border-t border-gray-700 my-1"></div>
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onNavigate('signin');
                  }}
                  className="w-full flex items-center text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500 hover:text-white rounded-b-lg"
                >
                  <LogoutIcon className="w-5 h-5 mr-3" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow p-6 overflow-y-auto">
        <section className="mb-8">
          <div className="bg-gradient-to-br from-red-500 to-orange-500 p-6 rounded-2xl shadow-lg relative overflow-hidden h-[150px] flex flex-col justify-center">
            <LiquidProgress progress={progress} />
            <div className="relative z-10">
                <h3 className="text-lg font-semibold text-red-200">Steps</h3>
                <p className="text-4xl font-bold my-1">{currentSteps.toLocaleString()} / <span className="text-2xl font-normal text-red-200">{goalSteps.toLocaleString()}</span></p>
                <p className="text-sm text-red-200">You have covered {Math.round(progress)}% of the goal</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">Leaderboard</h2>
          <div className="bg-slate-800 p-4 rounded-2xl">
            {isLoading ? (
              <div className="text-center py-4">
                <p className="text-gray-400">Loading leaderboard...</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {leaderboardData.slice(0, 3).map((entry, index) => (
                  <li key={entry.userId} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className={`w-8 text-center text-xl font-bold ${getRankClass(index)}`}>{entry.rank}</span>
                      <div className="mx-4">
                        <Avatar name={entry.name} size={40} />
                      </div>
                      <span className="text-xl mr-2">{getMedalSymbol(index)}</span>
                      <span className="font-semibold">{entry.name}</span>
                    </div>
                    <span className="text-gray-400">{entry.totalSteps.toLocaleString()} steps</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold mb-4">Campus Map</h2>
          <div className="bg-slate-800 p-0 rounded-2xl overflow-hidden">
            <div id="home-map" className="w-full h-[300px]"></div>
          </div>
        </section>

        <button 
          onClick={() => onNavigate('disclaimer')}
          className="w-full py-5 bg-red-600 rounded-2xl font-bold text-lg hover:bg-red-700 transition-colors shadow-lg"
        >
          Start RUN
        </button>

        <section className="mt-8">
            <h2 className="text-xl font-bold mb-4">Connect with Friends</h2>
            <div className="bg-slate-800 p-4 rounded-2xl">
                <div className="relative mb-4">
                    <input
                        type="text"
                        placeholder="Search for friends..."
                        value={friendSearchTerm}
                        onChange={(e) => setFriendSearchTerm(e.target.value)}
                        className="w-full p-3 pl-10 bg-slate-900 rounded-lg border border-transparent focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition"
                    />
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                {filteredFriends.length > 0 ? (
                    <ul className="space-y-4">
                        {filteredFriends.map((friend, index) => (
                            <li key={index} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <Avatar name={friend.name} size={40} />
                                    <span className="font-semibold ml-4">{friend.name}</span>
                                </div>
                                <button className="flex items-center px-4 py-2 bg-red-600/20 text-red-400 rounded-full hover:bg-red-600/40 transition">
                                    <UserPlusIcon className="w-5 h-5 mr-2" />
                                    Add
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-gray-400">No users found.</p>
                    </div>
                )}
            </div>
        </section>

      </main>
      
      <footer className="w-full bg-slate-800 p-4 rounded-t-3xl">
        <nav className="flex justify-around items-center">
          <button className="p-2 text-red-400">
            <HomeIcon className="w-8 h-8" />
          </button>
          <button onClick={() => onNavigate('leaderboard')} className="p-2 text-gray-500 hover:text-red-400 transition-colors">
            <ChartIcon className="w-8 h-8" />
          </button>
          <button className="p-2 text-gray-500 hover:text-red-400 transition-colors">
            <BellIcon className="w-8 h-8" />
          </button>
        </nav>
      </footer>
    </div>
  );
};

export default HomeScreen;
