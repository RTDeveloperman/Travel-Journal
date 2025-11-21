
import React, { useState, useEffect, useCallback } from 'react';
import { MemoryEntry, User } from '../types';
import * as dataService from '../services/dataService';
import MemoryCard from './MemoryCard';
import MemoryDetailModal from './MemoryDetailModal';

interface ExplorePageProps {
  currentUser: User;
  allUsers: User[];
  onViewUserProfile: (user: User) => void;
}

const ExplorePage: React.FC<ExplorePageProps> = ({ currentUser, allUsers, onViewUserProfile }) => {
  const [publicMemories, setPublicMemories] = useState<MemoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingMemory, setViewingMemory] = useState<MemoryEntry | null>(null);

  const fetchPublicMemories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const memories = await dataService.fetchAllPublicMemories();
      setPublicMemories(memories);
    } catch (e: any) {
      setError("خطا در بارگذاری خاطرات عمومی: " + e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPublicMemories();
  }, [fetchPublicMemories]);
  
  const handleViewDetails = (memory: MemoryEntry) => {
    setViewingMemory(memory);
  };
  
  const handleCloseDetails = () => {
    setViewingMemory(null);
  };

  const getMemoryOwner = (userId: string): User | undefined => {
    return allUsers.find(u => u.id === userId);
  };
  
  // These actions are disabled for other users' memories in explore view.
  const handleDummyAction = (action: string) => {
    alert(`This action (${action}) is not available in Explore mode.`);
  }

  return (
    <div className="py-6">
      <div className="bg-white bg-opacity-90 p-6 rounded-xl shadow-xl mb-8 text-right">
        <h2 className="text-3xl font-semibold text-slate-800 mb-2">
          <i className="fas fa-compass ml-3 text-blue-500"></i>صفحه کاوش
        </h2>
        <p className="text-sm text-slate-600">
          جدیدترین و محبوب‌ترین خاطرات سفر اشتراک گذاشته شده توسط کاربران را ببینید.
        </p>
      </div>

      {isLoading && (
        <div className="text-center py-10">
          <i className="fas fa-spinner fa-spin text-4xl text-sky-500"></i>
          <p className="mt-2 text-white text-lg">در حال بارگذاری خاطرات...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border-r-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-lg" role="alert">
          <p className="font-bold">خطا</p>
          <p>{error}</p>
        </div>
      )}

      {!isLoading && !error && publicMemories.length === 0 && (
        <div className="text-center py-12 bg-white bg-opacity-80 rounded-lg shadow-xl mt-8">
          <i className="fas fa-map-marked-alt text-7xl text-slate-400 mb-6"></i>
          <h2 className="text-3xl font-semibold text-slate-700">صفحه کاوش هنوز خالی است</h2>
          <p className="text-slate-500 mt-3 text-lg">
            وقتی کاربران خاطرات خود را به صورت عمومی به اشتراک بگذارند، در اینجا نمایش داده می‌شوند.
          </p>
        </div>
      )}

      {!isLoading && !error && publicMemories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {publicMemories.map(memory => {
              const owner = getMemoryOwner(memory.userId);
              return (
                 <MemoryCard 
                    key={memory.id} 
                    memory={memory} 
                    // Pass empty list for companions as it's not relevant here
                    companionsList={[]}
                    // Pass dummy functions for actions that are owner-specific
                    onDelete={() => handleDummyAction('delete')}
                    onEdit={() => handleDummyAction('edit')}
                    onShare={() => handleDummyAction('share')}
                    onViewDetails={handleViewDetails} 
                    currentUser={currentUser}
                    ownerInfo={owner} // Pass owner info to the card
                />
              )
          })}
        </div>
      )}

      {viewingMemory && (
          <MemoryDetailModal
              memory={viewingMemory}
              companionsList={[]}
              onClose={handleCloseDetails}
              onEdit={() => handleDummyAction('edit')}
              onDelete={() => handleDummyAction('delete')}
              currentUser={currentUser}
              onShare={() => handleDummyAction('share')}
          />
      )}
    </div>
  );
};

export default ExplorePage;
