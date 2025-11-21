







import React, { useState, useEffect, useCallback } from 'react';
import { MemoryEntry, ImageFile, Coordinates, Companion, MemoryCompanionLink, SearchCriteria, MapBoundsCoordinates, User, ChronicleEvent } from './types';
import { USER_ROLES } from './constants';
import MemoryForm from './components/MemoryForm';
import MemoryCard from './components/MemoryCard';
import MemoryDetailModal from './components/MemoryDetailModal';
import CompanionsManager from './components/CompanionsManager'; 
import SearchFilters from './components/SearchFilters';
import MapBoundsSelector from './components/MapBoundsSelector';
import LoginPage from './components/LoginPage';
import AdminDashboard from './components/AdminDashboard';
import ChroniclePage from './components/ChroniclePage'; 
import ChronicleTimelinePage from './components/ChronicleTimelinePage'; // New
import ShareItemModal from './components/ShareItemModal';
import ProfileManager from './components/ProfileManager';
import UserProfileViewerModal from './components/UserProfileViewerModal';
import ChatPage from './components/ChatPage'; // Added ChatPage
import ExplorePage from './components/ExplorePage'; // Added ExplorePage
import ChronicleDetailModal from './components/ChronicleDetailModal'; // Added for chat sharing
import { generateTravelReflection } from './services/geminiService';
import {
  initializeMockDataForUser,
  fetchMemoriesForUser,
  fetchCompanionsForUser,
  fetchChronicleEventsForUser,
  addMemoryForUser,
  updateMemoryForUser,
  deleteMemoryForUser,
  addCompanionForUser,
  addChronicleEventForUser,
  updateChronicleEventForUser,
  deleteChronicleEventForUser,
  shareItem
} from './services/dataService';
import * as authService from './services/authService';
import { initializeMockChatData } from './services/chatService'; // For chat
import { GenderOption } from './types'; 

type ActiveView = 'travelJournal' | 'chronicle' | 'chat' | 'chronicleTimeline' | 'explore'; 
type SharingItemType = { id: string; title: string; type: 'memory' | 'chronicle', ownerUserId: string; };


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); 
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('travelJournal');
  const [allUsers, setAllUsers] = useState<User[]>([]); // Renamed for clarity


  // User-specific data states
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [displayedMemories, setDisplayedMemories] = useState<MemoryEntry[]>([]);
  const [companionsList, setCompanionsList] = useState<Companion[]>([]);
  const [chronicleEvents, setChronicleEvents] = useState<ChronicleEvent[]>([]); 
  
  // UI states for User Dashboard (Travel Journal)
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingMemory, setEditingMemory] = useState<MemoryEntry | null>(null);
  const [isProcessingForm, setIsProcessingForm] = useState<boolean>(false); 
  const [viewingMemory, setViewingMemory] = useState<MemoryEntry | null>(null);
  const [showCompanionsManager, setShowCompanionsManager] = useState<boolean>(false);
  const [showProfileManager, setShowProfileManager] = useState<boolean>(false); 
  const [showSearchFilters, setShowSearchFilters] = useState<boolean>(false);
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria | null>(null);
  const [showMapBoundsSelector, setShowMapBoundsSelector] = useState<boolean>(false);
  const [currentSearchMapBounds, setCurrentSearchMapBounds] = useState<MapBoundsCoordinates | null>(null);

  // Sharing Modal State
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [sharingItemDetails, setSharingItemDetails] = useState<SharingItemType | null>(null);

  // User Profile Viewer Modal State
  const [viewingUserProfile, setViewingUserProfile] = useState<User | null>(null);
  const [showUserProfileViewerModal, setShowUserProfileViewerModal] = useState<boolean>(false);
  
  // Chat state & related modals
  const [activeChatTargetUserId, setActiveChatTargetUserId] = useState<string | null>(null);
  const [viewingChronicleFromChat, setViewingChronicleFromChat] = useState<ChronicleEvent | null>(null);


  useEffect(() => {
    setIsLoading(false); 
  }, []);
  
  // Auto-dismiss global error after 5 seconds
  useEffect(() => {
    if (globalError) {
      const timer = setTimeout(() => {
        setGlobalError(null);
      }, 5000); // 5 seconds
      return () => clearTimeout(timer);
    }
  }, [globalError]);

  const loadUserData = useCallback(async (user: User) => {
    if (!user) return;
    setIsLoading(true);
    setGlobalError(null);
    try {
      initializeMockDataForUser(user);

      // Fetch all users first to have them available for context
      const allUsersList = await authService.fetchAllUsersPublicList();
      setAllUsers(allUsersList);
      
      const [userMemories, userCompanions, userChronicleEvents] = await Promise.all([
        fetchMemoriesForUser(user.id),
        fetchCompanionsForUser(user.id),
        fetchChronicleEventsForUser(user.id),
      ]);
      setMemories(userMemories);
      setCompanionsList(userCompanions);
      setChronicleEvents(userChronicleEvents); 
      
      // Initialize mock chat data (idempotent)
      initializeMockChatData(allUsersList);
      
      const refreshedUser = allUsersList.find(u => u.id === user.id);
      if (refreshedUser) {
        setCurrentUser(refreshedUser);
      } else {
        console.error("Failed to refresh current user data, user might be invalid.");
        handleLogout(); 
      }

    } catch (e: any) {
      console.error("Failed to load user data:", e);
      setGlobalError("امکان بارگذاری اطلاعات کاربر وجود ندارد: " + e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);


  useEffect(() => {
    if (currentUser?.id) { 
      loadUserData(currentUser);
    } else {
      setMemories([]);
      setCompanionsList([]);
      setChronicleEvents([]);
      setAllUsers([]);
    }
  }, [currentUser?.id]); // Removed loadUserData from dep array as it's stable


  useEffect(() => {
    if (!currentUser || currentUser.role !== USER_ROLES.USER || activeView !== 'travelJournal') {
        setDisplayedMemories([]);
        return;
    }
    if (!searchCriteria) {
      setDisplayedMemories(memories);
      return;
    }
    const filtered = memories.filter(memory => {
      if (searchCriteria.text) {
        const searchText = searchCriteria.text.toLowerCase();
        if (![memory.locationName, memory.title, memory.description].some(field => field.toLowerCase().includes(searchText))) return false;
      }
      if (searchCriteria.eventDateStart && new Date(memory.eventDate).setHours(0,0,0,0) < new Date(searchCriteria.eventDateStart).setHours(0,0,0,0)) return false;
      if (searchCriteria.eventDateEnd && new Date(memory.eventDate).setHours(0,0,0,0) > new Date(searchCriteria.eventDateEnd).setHours(0,0,0,0)) return false;
      if (searchCriteria.createdAtStart && new Date(memory.createdAt).setHours(0,0,0,0) < new Date(searchCriteria.createdAtStart).setHours(0,0,0,0)) return false;
      if (searchCriteria.createdAtEnd && new Date(memory.createdAt).setHours(0,0,0,0) > new Date(searchCriteria.createdAtEnd).setHours(0,0,0,0)) return false;
      if (searchCriteria.companions && searchCriteria.companions.length > 0) {
        if (!memory.companions || !memory.companions.some(mc => searchCriteria.companions!.includes(mc.companionId))) return false;
      }
      if (searchCriteria.mapBounds && memory.latitude && memory.longitude) {
        const { southWest, northEast } = searchCriteria.mapBounds;
        if (!(memory.latitude >= southWest.lat && memory.latitude <= northEast.lat && memory.longitude >= southWest.lng && memory.longitude <= northEast.lng)) return false;
      }
      return true;
    });
    setDisplayedMemories(filtered);
  }, [memories, searchCriteria, currentUser, activeView]);

  const handleLogin = async (username: string, password_placeholder: string): Promise<User | null> => {
    const user = await authService.loginUser(username, password_placeholder);
    if (user) {
      setCurrentUser(user); 
      setActiveView('travelJournal'); 
      setGlobalError(null);
    }
    return user; 
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowProfileManager(false); 
    setMemories([]);
    setCompanionsList([]);
    setChronicleEvents([]);
    setDisplayedMemories([]);
    setShowForm(false);
    setEditingMemory(null);
    setViewingMemory(null);
    setShowCompanionsManager(false);
    setShowSearchFilters(false);
    setSearchCriteria(null);
    setActiveView('travelJournal');
    setAllUsers([]);
    setShowShareModal(false);
    setSharingItemDetails(null);
    setShowUserProfileViewerModal(false); 
    setViewingUserProfile(null); 
    setActiveChatTargetUserId(null); // Clear active chat target
    setViewingChronicleFromChat(null);
    setGlobalError(null);
  };

  const handleUpdateUserProfile = useCallback(async (
    payload: { 
      handle?: string; 
      activeAvatarId?: string; 
      newProfileImage?: ImageFile; 
      deleteProfileImageId?: string;
      firstName?: string;
      lastName?: string;
      searchableByName?: boolean;
      country?: string;
      dateOfBirth?: string;
      gender?: GenderOption; 
      bio?: string; 
    }
  ): Promise<User | null> => {
    if (!currentUser) {
      setGlobalError("ابتدا باید وارد شوید.");
      return null;
    }
    setIsLoading(true);
    setGlobalError(null);
    try {
      const updatedUser = await authService.updateUserProfile(currentUser.id, payload);
      setCurrentUser(updatedUser); 
      setAllUsers(prev => 
        prev.map(u => u.id === updatedUser.id ? updatedUser : u)
      );
      return updatedUser;
    } catch (e: any) {
      setGlobalError("خطا در به‌روزرسانی پروفایل: " + e.message);
      throw e; 
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);


  // --- Travel Journal Specific Handlers ---
  const handleAddNewMemory = useCallback(async (
    locationName: string, title: string, description: string, images: ImageFile[], 
    companions: MemoryCompanionLink[], eventDate: string, coordinates?: Coordinates, includeInEventsTour?: boolean, showInExplore?: boolean
  ) => {
    if (!currentUser) { setGlobalError("ابتدا باید وارد شوید."); return; }
    setIsProcessingForm(true); setGlobalError(null);
    let geminiText = "امکان تولید تامل هوش مصنوعی وجود نداشت.";
    if (process.env.API_KEY) {
        try { geminiText = await generateTravelReflection(locationName, description); } 
        catch (e: any) { setGlobalError(`خطا در تولید تامل هوش مصنوعی: ${e.message}`); geminiText = "تولید تامل هوش مصنوعی با شکست مواجه شد.";}
    } else { geminiText = "کلید API پیکربندی نشده است."; }

    const memoryData = { locationName, title, description, images, eventDate, latitude: coordinates?.lat, longitude: coordinates?.lng, companions, includeInEventsTour, showInExplore };
    try {
      const newMemory = await addMemoryForUser(currentUser.id, memoryData, geminiText);
      setMemories(prev => [newMemory, ...prev]);
      setShowForm(false);
    } catch (e: any) { setGlobalError("خطا در افزودن خاطره: " + e.message); } 
    finally { setIsProcessingForm(false); }
  }, [currentUser]);

  const handleUpdateMemory = useCallback(async (
    id: string, locationName: string, title: string, description: string, images: ImageFile[],
    companionsLinks: MemoryCompanionLink[], eventDate: string, coordinates: Coordinates | undefined,
    originalCreatedAt: string, originalGeminiPondering: string | undefined, includeInEventsTour?: boolean, showInExplore?: boolean
  ) => {
    if (!currentUser) { setGlobalError("ابتدا باید وارد شوید."); return; }
    setIsProcessingForm(true); setGlobalError(null);
    
    const originalMemory = memories.find(mem => mem.id === id);

    const updatedMemoryData: MemoryEntry = {
      id, userId: originalMemory?.userId || currentUser.id, 
      locationName, title, description, images, eventDate, 
      createdAt: originalCreatedAt, geminiPondering: originalGeminiPondering, 
      latitude: coordinates?.lat, longitude: coordinates?.lng, companions: companionsLinks,
      includeInEventsTour: includeInEventsTour,
      showInExplore: showInExplore,
      sharedWith: originalMemory?.sharedWith || [] 
    };
    try {
      const updatedMem = await updateMemoryForUser(currentUser.id, updatedMemoryData);
      setMemories(prev => prev.map(mem => (mem.id === id ? updatedMem : mem)));
      setShowForm(false); setEditingMemory(null);
    } catch (e: any) { setGlobalError("خطا در به‌روزرسانی خاطره: " + e.message); } 
    finally { setIsProcessingForm(false); }
  }, [currentUser, memories]);

  const handleFormSubmit = useCallback(async (
    locationName: string, title: string, description: string, images: ImageFile[], 
    companions: MemoryCompanionLink[], eventDate: string, coordinates?: Coordinates, includeInEventsTour?: boolean, showInExplore?: boolean
  ) => {
    if (editingMemory) {
      await handleUpdateMemory( editingMemory.id, locationName, title, description, images, companions, eventDate, coordinates, editingMemory.createdAt, editingMemory.geminiPondering, includeInEventsTour, showInExplore);
    } else {
      await handleAddNewMemory(locationName, title, description, images, companions, eventDate, coordinates, includeInEventsTour, showInExplore);
    }
  }, [editingMemory, handleAddNewMemory, handleUpdateMemory]);

  const handleDeleteMemory = useCallback(async (id: string) => {
    if (!currentUser) return;
    try {
      await deleteMemoryForUser(currentUser.id, id); 
      setMemories(prev => prev.filter(memory => memory.id !== id));
      if (editingMemory && editingMemory.id === id) { setEditingMemory(null); setShowForm(false); }
      if (viewingMemory && viewingMemory.id === id) { setViewingMemory(null); }
    } catch (e: any) { setGlobalError("خطا در حذف خاطره: " + e.message); }
  }, [currentUser, editingMemory, viewingMemory]);

  const handleAddCompanion = useCallback(async (companionData: Omit<Companion, 'id' | 'userId'>) => {
    if (!currentUser) return;
    try {
      const newCompanion = await addCompanionForUser(currentUser.id, companionData);
      setCompanionsList(prev => [...prev, newCompanion]);
    } catch (e: any) { setGlobalError("خطا در افزودن همسفر: " + e.message); }
  }, [currentUser]);

  // --- Chronicle Event Handlers ---
  const handleAddChronicleEvent = useCallback(async (eventData: Omit<ChronicleEvent, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'sharedWith'>) => {
    if (!currentUser) { setGlobalError("ابتدا باید وارد شوید."); return; }
    setIsLoading(true); 
    setGlobalError(null);
    try {
      const newEvent = await addChronicleEventForUser(currentUser.id, eventData);
      setChronicleEvents(prev => [newEvent, ...prev].sort((a,b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()));
    } catch (e: any) { setGlobalError("خطا در افزودن رویداد روزنگار: " + e.message); }
    finally { setIsLoading(false); }
  }, [currentUser]);

  const handleUpdateChronicleEvent = useCallback(async (eventData: ChronicleEvent) => {
    if (!currentUser) { setGlobalError("ابتدا باید وارد شوید."); return; }
    setIsLoading(true);
    setGlobalError(null);

    const originalEvent = chronicleEvents.find(e => e.id === eventData.id);
    const eventUpdateWithShared = { ...eventData, sharedWith: originalEvent?.sharedWith || [] };

    try {
      const updatedEvent = await updateChronicleEventForUser(currentUser.id, eventUpdateWithShared); 
      setChronicleEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e).sort((a,b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()));
    } catch (e: any) { setGlobalError("خطا در به‌روزرسانی رویداد روزنگار: " + e.message); }
    finally { setIsLoading(false); }
  }, [currentUser, chronicleEvents]);

  const handleDeleteChronicleEvent = useCallback(async (eventId: string) => {
    if (!currentUser) return;
    setIsLoading(true);
    setGlobalError(null);
    try {
      await deleteChronicleEventForUser(currentUser.id, eventId); 
      setChronicleEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (e: any) { setGlobalError("خطا در حذف رویداد روزنگار: " + e.message); }
    finally { setIsLoading(false); }
  }, [currentUser]);

  // --- Sharing Handlers ---
  const handleOpenShareModal = (id: string, title: string, type: 'memory' | 'chronicle', ownerUserId: string) => {
    setSharingItemDetails({ id, title, type, ownerUserId });
    setShowShareModal(true);
  };
  const handleCloseShareModal = () => {
    setShowShareModal(false);
    setSharingItemDetails(null);
  };
  const handleConfirmShare = async (targetUsers: User[]) => {
    if (!sharingItemDetails || !currentUser) {
      setGlobalError("اطلاعات مورد نیاز برای اشتراک‌گذاری موجود نیست.");
      return;
    }
    if (sharingItemDetails.ownerUserId !== currentUser.id) {
        setGlobalError("فقط صاحب آیتم می‌تواند آن را به اشتراک بگذارد.");
        return;
    }

    let successCount = 0;
    let errorCount = 0;
    const errorMessages: string[] = [];
    setGlobalError(null); 

    for (const targetUser of targetUsers) {
        try {
            await shareItem(
                sharingItemDetails.id, 
                sharingItemDetails.type, 
                targetUser.id, 
                targetUser.username, 
                currentUser.id, 
                targetUser.handle, 
                targetUser.avatarUrl,
                targetUser.firstName,
                targetUser.lastName
            );
            successCount++;
        } catch (e: any) {
            errorCount++;
            const userDisplay = targetUser.handle || targetUser.username;
            errorMessages.push(`اشتراک با ${userDisplay}: ${e.message}`);
            console.error(`Error sharing item ${sharingItemDetails.id} with ${userDisplay} (ID: ${targetUser.id}):`, e);
        }
    }

    if (currentUser) { 
        if (sharingItemDetails.type === 'memory') {
          const updatedMemories = await fetchMemoriesForUser(currentUser.id);
          setMemories(updatedMemories);
        } else {
          const updatedChronicles = await fetchChronicleEventsForUser(currentUser.id);
          setChronicleEvents(updatedChronicles);
        }
    }

    let alertMessage = "";
    if (successCount > 0) {
        alertMessage += `آیتم "${sharingItemDetails.title}" با ${successCount} کاربر با موفقیت به اشتراک گذاشته شد.`;
    }
    if (errorCount > 0) {
        if (alertMessage) alertMessage += "\n";
        alertMessage += `${errorCount} مورد اشتراک‌گذاری با خطا مواجه شد.`;
        if (successCount === 0) { 
            setGlobalError(`اشتراک‌گذاری آیتم "${sharingItemDetails.title}" با تمام کاربران منتخب با خطا مواجه شد. ${errorMessages.join(' ')}`);
        } else { 
            setGlobalError(`برخی از اشتراک‌گذاری‌ها برای آیتم "${sharingItemDetails.title}" با خطا مواجه شدند. ${errorMessages.join(' ')}`);
        }
    }
    
    if(alertMessage && !globalError) alert(alertMessage); 
    
    handleCloseShareModal();
  };

  // --- Follow/Social Handlers ---
  const handleSocialAction = useCallback(async (action: Promise<any>) => {
    if (!currentUser) return;
    try {
        await action;
        await loadUserData(currentUser); // Refresh all user data after action
    } catch (e: any) {
        setGlobalError(e.message || "خطا در انجام عملیات اجتماعی.");
    }
  }, [currentUser, loadUserData]);

  const handleSendFollowRequest = (targetId: string) => handleSocialAction(authService.sendFollowRequest(currentUser!.id, targetId));
  const handleAcceptFollowRequest = (requesterId: string) => handleSocialAction(authService.acceptFollowRequest(currentUser!.id, requesterId));
  const handleDeclineFollowRequest = (requesterId: string) => handleSocialAction(authService.declineFollowRequest(currentUser!.id, requesterId));
  const handleUnfollow = (targetId: string) => handleSocialAction(authService.unfollowUser(currentUser!.id, targetId));


  // --- User Profile Viewer Handlers ---
  const handleViewUserProfile = (user: User) => {
    setViewingUserProfile(user);
    setShowUserProfileViewerModal(true);
  };
  const handleCloseUserProfileViewerModal = () => {
    setViewingUserProfile(null);
    setShowUserProfileViewerModal(false);
    if(activeChatTargetUserId) setActiveChatTargetUserId(null); // Clear if closing from profile modal chat button context
  };
  
  const handleInitiateChatFromProfile = (targetUser: User) => {
    setActiveChatTargetUserId(targetUser.id);
    setActiveView('chat');
    setShowUserProfileViewerModal(false); // Close profile modal
  };

  // --- Chat Item Viewer Handlers ---
  const handleViewItemFromChat = async (itemId: string, type: 'memory' | 'chronicle') => {
    if (type === 'memory') {
        let memory = memories.find(m => m.id === itemId);
        if (!memory && currentUser) { // If not found, refetch data
            const allMemories = await fetchMemoriesForUser(currentUser.id);
            setMemories(allMemories);
            memory = allMemories.find(m => m.id === itemId);
        }

        if (memory) {
            setViewingMemory(memory); // Updated to directly set modal state
        } else {
            setGlobalError("خاطره مورد نظر یافت نشد یا شما به آن دسترسی ندارید.");
        }
    } else if (type === 'chronicle') {
        let event = chronicleEvents.find(e => e.id === itemId);
        if (!event && currentUser) { // If not found, refetch data
            const allChronicles = await fetchChronicleEventsForUser(currentUser.id);
            setChronicleEvents(allChronicles);
            event = allChronicles.find(e => e.id === itemId);
        }

        if (event) {
            setViewingChronicleFromChat(event);
        } else {
            setGlobalError("رویداد روزنگار مورد نظر یافت نشد یا شما به آن دسترسی ندارید.");
        }
    }
  };
  const handleCloseChronicleDetailModal = () => {
    setViewingChronicleFromChat(null);
  };


  // UI Toggles
  const handleStartEdit = useCallback((memory: MemoryEntry) => { setViewingMemory(null); setEditingMemory(memory); setShowForm(true); setGlobalError(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }, []);
  const handleToggleForm = () => { if (showForm && editingMemory) setEditingMemory(null); else if (!showForm) { setEditingMemory(null); setViewingMemory(null); } setShowForm(!showForm); setGlobalError(null); };
  const handleCancelForm = () => { setShowForm(false); setEditingMemory(null); setGlobalError(null); };
  const handleViewMemoryDetails = (memory: MemoryEntry) => { if (showForm) setShowForm(false); setEditingMemory(null); setViewingMemory(memory); };
  const handleCloseMemoryDetails = () => setViewingMemory(null);
  const toggleCompanionsManager = () => setShowCompanionsManager(!showCompanionsManager);
  const toggleProfileManager = () => setShowProfileManager(!showProfileManager); 
  const handleToggleSearchFilters = () => setShowSearchFilters(prev => !prev);
  const handleApplySearch = (criteria: SearchCriteria) => setSearchCriteria(criteria);
  const handleResetSearch = () => { setSearchCriteria(null); setCurrentSearchMapBounds(null); };
  const handleOpenMapBoundsSelector = () => setShowMapBoundsSelector(true);
  const handleCloseMapBoundsSelector = () => setShowMapBoundsSelector(false);
  const handleMapBoundsSelected = (bounds: MapBoundsCoordinates) => { setCurrentSearchMapBounds(bounds); setShowMapBoundsSelector(false);};
  const handleSetActiveView = (view: ActiveView) => {
    setActiveView(view);
  };


  if (isLoading && !currentUser && !globalError) { 
    return ( <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"> <div className="bg-white p-8 rounded-lg shadow-xl text-center"> <i className="fas fa-spinner fa-spin text-4xl text-sky-500 mb-4"></i> <p className="text-gray-700 text-lg">بارگذاری برنامه...</p> </div> </div> );
  }
  
  if (!currentUser) {
    return ( <> {globalError && ( <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md p-4 z-[100]"> <div className="bg-red-100 border-r-4 border-red-500 text-red-700 p-4 rounded-md shadow-lg text-right" role="alert"> <p className="font-bold">خطا</p> <p>{globalError}</p> </div> </div> )} <LoginPage onLogin={handleLogin} setLoading={setIsLoading} setError={setGlobalError} /> </> );
  }

  if (currentUser.role === USER_ROLES.ADMIN) {
    return <AdminDashboard currentUser={currentUser} onLogout={handleLogout} onViewUserProfile={handleViewUserProfile} />;
  }

  const getWelcomeMessage = () => {
    if (currentUser.firstName && currentUser.lastName) {
      return `${currentUser.firstName} ${currentUser.lastName} عزیز، خوش آمدید!`;
    } else if (currentUser.firstName) {
      return `${currentUser.firstName} عزیز، خوش آمدید!`;
    } else {
      return `کاربر ${currentUser.handle || currentUser.username}، خوش آمدید!`;
    }
  };


  return (
    <div className="min-h-screen bg-cover bg-fixed bg-center" style={{ backgroundImage: "url('https://source.unsplash.com/random/1920x1080?travel,adventure,world,map')" }}>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-black bg-opacity-60 backdrop-blur-lg min-h-screen">
        <header className="mb-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <div className="flex items-center text-right mb-4 sm:mb-0">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="آواتار کاربر" className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-sky-300 shadow-lg ml-4 object-cover flex-shrink-0" />
              ) : (
                 <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-sky-300 shadow-lg ml-4 bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-user text-3xl text-slate-400"></i>
                 </div>
              )}
              <div className="flex-grow">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight" style={{textShadow: '2px 2px 8px rgba(0,0,0,0.8)'}}>
                  <i className="fas fa-atlas ml-2 text-sky-300"></i>{getWelcomeMessage()}
                </h1>
                 <p className="text-md sm:text-lg text-sky-100 mt-1" style={{textShadow: '1px 1px 4px rgba(0,0,0,0.6)'}}>
                  {activeView === 'travelJournal' ? 'ماجراهای سفر خود را ثبت و مرور کنید.' : 
                   activeView === 'chronicle' ? 'وقایع روزانه خود را مرور و ثبت کنید.' :
                   activeView === 'chronicleTimeline' ? 'تمام رویدادهای خود را در یک نگاه ببینید.' :
                   activeView === 'explore' ? 'خاطرات دیگران را کاوش کنید.' :
                   activeView === 'chat' ? 'با دیگران گفتگو کنید.' : ''
                  }
                </p>
              </div>
            </div>

            <div className="flex space-x-2 space-x-reverse items-center">
                <button 
                    onClick={toggleProfileManager} 
                    className="relative p-3 text-white bg-purple-500 bg-opacity-70 rounded-full hover:bg-purple-600 hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-purple-400 transition-all"
                    aria-label="مدیریت پروفایل"
                    title="پروفایل من"
                >
                    <i className="fas fa-user-edit text-xl"></i>
                    {(currentUser.pendingFollowRequests?.length || 0) > 0 && 
                      <span className="absolute -top-1 -right-1 flex h-5 w-5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs items-center justify-center">
                            {currentUser.pendingFollowRequests?.length}
                          </span>
                      </span>
                    }
                </button>
                <button
                    onClick={handleLogout}
                    className="p-3 text-white bg-red-600 bg-opacity-70 rounded-full hover:bg-red-700 hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-red-500 transition-all"
                    aria-label="خروج از حساب کاربری"
                    title="خروج"
                >
                    <i className="fas fa-sign-out-alt text-xl"></i>
                </button>
            </div>
          </div>
          
          <nav className="flex justify-center border-b-2 border-sky-600 border-opacity-50 pb-0">
            <button 
              onClick={() => handleSetActiveView('travelJournal')}
              className={`px-5 py-3 text-lg font-semibold rounded-t-lg transition-all duration-200 ease-in-out transform focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-opacity-50
                          ${activeView === 'travelJournal' ? 'bg-sky-500 bg-opacity-60 text-white border-b-4 border-sky-200 scale-105' : 'text-sky-100 hover:bg-sky-700 hover:bg-opacity-40 hover:text-white'}`}
            >
              <i className="fas fa-route mr-2"></i>خاطرات سفر
            </button>
             <button 
              onClick={() => handleSetActiveView('explore')}
              className={`px-5 py-3 text-lg font-semibold rounded-t-lg transition-all duration-200 ease-in-out transform focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-opacity-50
                          ${activeView === 'explore' ? 'bg-sky-500 bg-opacity-60 text-white border-b-4 border-sky-200 scale-105' : 'text-sky-100 hover:bg-sky-700 hover:bg-opacity-40 hover:text-white'}`}
            >
              <i className="fas fa-compass mr-2"></i>کاوش
            </button>
            <button 
              onClick={() => handleSetActiveView('chronicle')}
              className={`px-5 py-3 text-lg font-semibold rounded-t-lg transition-all duration-200 ease-in-out transform focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-opacity-50
                          ${activeView === 'chronicle' ? 'bg-sky-500 bg-opacity-60 text-white border-b-4 border-sky-200 scale-105' : 'text-sky-100 hover:bg-sky-700 hover:bg-opacity-40 hover:text-white'}`}
            >
              <i className="fas fa-calendar-alt mr-2"></i>روزنگار
            </button>
            <button 
              onClick={() => handleSetActiveView('chronicleTimeline')}
              className={`px-5 py-3 text-lg font-semibold rounded-t-lg transition-all duration-200 ease-in-out transform focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-opacity-50
                          ${activeView === 'chronicleTimeline' ? 'bg-sky-500 bg-opacity-60 text-white border-b-4 border-sky-200 scale-105' : 'text-sky-100 hover:bg-sky-700 hover:bg-opacity-40 hover:text-white'}`}
            >
              <i className="fas fa-stream mr-2"></i>خط زمانی روزنگار
            </button>
             <button 
              onClick={() => handleSetActiveView('chat')}
              className={`px-5 py-3 text-lg font-semibold rounded-t-lg transition-all duration-200 ease-in-out transform focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-opacity-50
                          ${activeView === 'chat' ? 'bg-sky-500 bg-opacity-60 text-white border-b-4 border-sky-200 scale-105' : 'text-sky-100 hover:bg-sky-700 hover:bg-opacity-40 hover:text-white'}`}
            >
              <i className="fas fa-comments mr-2"></i>چت
            </button>
          </nav>
        </header>

        {globalError && (
          <div className="bg-red-100 border-r-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-lg text-right" role="alert">
            <p className="font-bold">خطا</p>
            <p>{globalError}</p>
          </div>
        )}
        
        {!process.env.API_KEY && (activeView === 'travelJournal' || activeView === 'chronicle') && (
           <div className="bg-yellow-100 border-r-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md shadow-lg text-right" role="alert">
            <p className="font-bold">کلید API موجود نیست</p>
            <p>کلید Gemini API پیکربندی نشده است. برخی ویژگی‌های هوش مصنوعی (مانند تامل سفر و تور وقایع عمومی) غیرفعال خواهند بود.</p>
          </div>
        )}

        {showProfileManager && currentUser && (
            <ProfileManager
                isOpen={showProfileManager}
                onClose={toggleProfileManager}
                currentUser={currentUser}
                onUpdateProfile={handleUpdateUserProfile}
                isLoading={isLoading} 
                allUsers={allUsers}
                onAcceptFollowRequest={handleAcceptFollowRequest}
                onDeclineFollowRequest={handleDeclineFollowRequest}
                onUnfollow={handleUnfollow}
                onViewUserProfile={handleViewUserProfile}
            />
        )}

        {activeView === 'travelJournal' && (
          <>
            <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
              <button onClick={handleToggleForm} className={`px-5 py-2.5 text-base font-semibold rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center
                ${showForm ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-sky-500 hover:bg-sky-600 text-white'}`}>
                {showForm ? <><i className="fas fa-times-circle mr-2"></i>انصراف</> : <><i className="fas fa-plus-circle mr-2"></i>افزودن خاطره</>}
              </button>
              <button onClick={toggleCompanionsManager} className="px-5 py-2.5 text-base font-semibold rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 bg-teal-500 hover:bg-teal-600 text-white flex items-center">
                <i className="fas fa-users mr-2"></i>همسفران
              </button>
              <button onClick={handleToggleSearchFilters} className="px-5 py-2.5 text-base font-semibold rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 bg-indigo-500 hover:bg-indigo-600 text-white flex items-center">
                <i className={`fas ${showSearchFilters ? 'fa-filter-circle-xmark' : 'fa-search'} mr-2`}></i>
                {showSearchFilters ? 'بستن جستجو' : 'جستجو'}
              </button>
            </div>


            {showSearchFilters && (
              <SearchFilters companionsList={companionsList} onApplyFilters={handleApplySearch} onResetFilters={handleResetSearch} onClose={handleToggleSearchFilters} onShowMapBoundsSelector={handleOpenMapBoundsSelector} currentMapBounds={currentSearchMapBounds} initialCriteria={searchCriteria} />
            )}
            {showMapBoundsSelector && (
              <MapBoundsSelector isOpen={showMapBoundsSelector} onSelect={handleMapBoundsSelected} onClose={handleCloseMapBoundsSelector} />
            )}
            {showForm && (
              <MemoryForm onSubmit={handleFormSubmit} onCancel={handleCancelForm} isLoading={isProcessingForm} initialData={editingMemory} companionsList={companionsList} />
            )}

            {isProcessingForm && !showForm && ( 
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl text-center"><i className="fas fa-spinner fa-spin text-4xl text-sky-500 mb-4"></i><p className="text-gray-700 text-lg">{editingMemory ? "در حال به‌روزرسانی..." : "در حال پردازش..."}</p></div>
                </div>
            )}
            
            {showCompanionsManager && currentUser && (
              <CompanionsManager 
                isOpen={showCompanionsManager} 
                onClose={toggleCompanionsManager} 
                companions={companionsList} 
                onAddCompanion={handleAddCompanion} 
                allUsers={allUsers.filter(u => u.id !== currentUser.id && u.role !== USER_ROLES.ADMIN)}
                currentUser={currentUser}
                onViewUserProfile={handleViewUserProfile} 
              />
            )}

            {isLoading && memories.length === 0 && <div className="text-center py-12 bg-white bg-opacity-80 rounded-lg shadow-xl mt-8"><i className="fas fa-spinner fa-spin text-6xl text-sky-500"></i><p className="mt-4 text-xl text-slate-600">در حال بارگذاری خاطرات شما...</p></div>}
            
            {!isLoading && displayedMemories.length === 0 && !showForm && !viewingMemory && !showSearchFilters && memories.length > 0 && searchCriteria && (
                <div className="text-center py-12 bg-white bg-opacity-80 rounded-lg shadow-xl mt-8">
                    <i className="fas fa-search-minus text-7xl text-slate-400 mb-6"></i> <h2 className="text-3xl font-semibold text-slate-700">نتیجه‌ای یافت نشد</h2>
                    <p className="text-slate-500 mt-3 text-lg">با معیارهای جستجوی شما هیچ خاطره‌ای مطابقت ندارد.</p>
                    <button onClick={handleResetSearch} className="mt-6 px-5 py-2.5 text-sm font-medium text-white bg-sky-500 rounded-md hover:bg-sky-600">پاک کردن فیلترها</button>
                </div>
            )}
            {!isLoading && memories.length === 0 && !showForm && !viewingMemory && (
              <div className="text-center py-12 bg-white bg-opacity-80 rounded-lg shadow-xl mt-8">
                <i className="fas fa-map-marked-alt text-7xl text-slate-400 mb-6"></i><h2 className="text-3xl font-semibold text-slate-700">دفترچه سفر شما خالی است</h2>
                <p className="text-slate-500 mt-3 text-lg">اولین خاطره سفر خود را اضافه کنید!</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
              {displayedMemories.map(memory => (
                <MemoryCard key={memory.id} memory={memory} companionsList={companionsList} onDelete={handleDeleteMemory} onEdit={handleStartEdit} onViewDetails={handleViewMemoryDetails} currentUser={currentUser} onShare={handleOpenShareModal} />
              ))}
            </div>
          </>
        )}

        {activeView === 'explore' && currentUser && (
          <ExplorePage 
            currentUser={currentUser}
            allUsers={allUsers}
            onViewUserProfile={handleViewUserProfile}
          />
        )}

        {activeView === 'chronicle' && currentUser && (
          <ChroniclePage 
            currentUser={currentUser}
            events={chronicleEvents}
            onAddEvent={handleAddChronicleEvent}
            onUpdateEvent={handleUpdateChronicleEvent}
            onDeleteEvent={handleDeleteChronicleEvent}
            isLoading={isLoading} 
            setError={setGlobalError}
            userMemories={memories} 
            onShareEvent={handleOpenShareModal}
          />
        )}
        
        {activeView === 'chronicleTimeline' && currentUser && (
          <ChronicleTimelinePage 
            currentUser={currentUser}
            allChronicleEvents={chronicleEvents}
            onViewEventDetails={(event) => setViewingChronicleFromChat(event)}
          />
        )}
        
        {activeView === 'chat' && currentUser && (
          <ChatPage 
            key={currentUser.id} // Ensure remount on user change
            currentUser={currentUser}
            allUsers={allUsers.filter(u => u.id !== currentUser.id && u.role !== USER_ROLES.ADMIN)}
            initialTargetUserId={activeChatTargetUserId}
            clearInitialTargetUser={() => setActiveChatTargetUserId(null)}
            onViewUserProfile={handleViewUserProfile}
            onViewItemFromChat={handleViewItemFromChat}
            userMemories={memories}
            userChronicleEvents={chronicleEvents}
          />
        )}


        {showShareModal && sharingItemDetails && currentUser && (
            <ShareItemModal
                isOpen={showShareModal}
                onClose={handleCloseShareModal}
                itemTitle={sharingItemDetails.title}
                itemId={sharingItemDetails.id}
                itemType={sharingItemDetails.type}
                ownerUserId={sharingItemDetails.ownerUserId}
                currentUser={currentUser}
                allUsers={allUsers.filter(u => u.id !== currentUser.id && u.role !== USER_ROLES.ADMIN)}
                onConfirmShare={handleConfirmShare}
                onViewUserProfile={handleViewUserProfile} 
            />
        )}
        
        {showUserProfileViewerModal && currentUser && (
            <UserProfileViewerModal 
                isOpen={showUserProfileViewerModal}
                onClose={handleCloseUserProfileViewerModal}
                targetUser={viewingUserProfile}
                onStartChat={handleInitiateChatFromProfile} 
                currentUser={currentUser}
                onSendFollowRequest={handleSendFollowRequest}
                onAcceptFollowRequest={handleAcceptFollowRequest}
                onDeclineFollowRequest={handleDeclineFollowRequest}
                onUnfollow={handleUnfollow}
            />
        )}
        
        {viewingChronicleFromChat && currentUser && (
            <ChronicleDetailModal 
                event={viewingChronicleFromChat}
                onClose={handleCloseChronicleDetailModal}
                currentUser={currentUser}
                allUsers={allUsers}
                onViewUserProfile={handleViewUserProfile}
            />
        )}

        {viewingMemory && (
            <MemoryDetailModal
                memory={viewingMemory}
                companionsList={companionsList}
                onClose={handleCloseMemoryDetails}
                onEdit={() => {
                    handleCloseMemoryDetails();
                    handleStartEdit(viewingMemory);
                }}
                onDelete={handleDeleteMemory}
                currentUser={currentUser}
                onShare={handleOpenShareModal}
            />
        )}


         <footer className="text-center mt-16 py-8 text-sm text-sky-100" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
          <p>&copy; {new Date().getFullYear()} اپلیکیشن دفترچه خاطرات و روزنگار.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;