


export type GenderOption = 'male' | 'female' | 'other' | 'prefer_not_to_say' | '';


export interface ImageFile {
  id: string;
  name: string;
  type: string;
  dataUrl: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface User {
  id: string;
  username: string; // Login username, must be unique. Synchronized with handle (without '@').
  role: 'admin' | 'user';
  dateOfBirth?: string; // ISO Date string (YYYY-MM-DD)
  country?: string; // Should ideally be a country code (e.g., 'IR', 'US')
  gender?: GenderOption; // Added gender field
  handle?: string; // Unique, user-defined display handle (e.g., @nickname). Starts with '@'. Synchronized with username.
  avatarUrl?: string; // URL of the active profile picture
  profileImages?: ImageFile[]; // Array of all uploaded profile pictures
  firstName?: string;
  lastName?: string;
  searchableByName?: boolean; // If true, other users can search this user by firstName/lastName
  bio?: string; // New field for user's short description
  isBanned?: boolean;
  _count?: {
    memories: number;
    chronicleEvents: number;
    sharedMemories: number;
  };
  // Social features
  followers?: string[]; // Array of user IDs of followers
  following?: string[]; // Array of user IDs of users this user is following
  pendingFollowRequests?: string[]; // Incoming follow requests (user IDs)
  sentFollowRequests?: string[]; // Outgoing follow requests (user IDs)
}

// Example structure for a more detailed country object if sourced from a list
export interface Country {
  code: string;
  name: string;
  nameEn: string; // Optional: English name for broader use
}

export interface Gender {
  code: GenderOption;
  name: string;
}


export interface Companion {
  id: string;
  userId: string; // The ID of the user who owns this companion entry
  name: string;
  contact?: string;
  generalRelationship?: string;
  notes?: string;
  // linkedRegisteredUserId?: string; // Optional: If this companion corresponds to a registered user
}

export interface MemoryCompanionLink {
  companionId: string;
  roleInTrip?: string;
}

export interface MemoryEntry {
  id: string;
  userId: string;
  locationName: string;
  title: string;
  description: string;
  images: ImageFile[];
  eventDate: string;
  createdAt: string;
  geminiPondering?: string;
  latitude?: number;
  longitude?: number;
  companions?: MemoryCompanionLink[];
  includeInEventsTour?: boolean;
  showInExplore?: boolean; // New field for public explore page
  sharedWith?: {
    userId: string;
    username: string;
    handle?: string;
    avatarUrl?: string;
    firstName?: string; // For richer display if needed on the item itself
    lastName?: string;  // For richer display if needed on the item itself
  }[];
}

export interface ChronicleEvent {
  id: string;
  userId: string;
  eventDate: string;
  title: string;
  description: string;
  image?: ImageFile | null;
  createdAt: string;
  updatedAt?: string;
  includeInEventsTour?: boolean;
  sharedWith?: {
    userId: string;
    username: string;
    handle?: string;
    avatarUrl?: string;
    firstName?: string; // For richer display if needed on the item itself
    lastName?: string;  // For richer display if needed on the item itself
  }[];
}

export interface HistoricalEvent {
  title: string;
  description: string;
  eventYearOrPeriod: string;
  category: 'country' | 'world' | 'general' | 'personal';
  persianCategory: string;
  originalId?: string;
  isPersonal?: boolean;
  eventDateFull?: string;
}


export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web?: GroundingChunkWeb;
  retrievedContext?: {
    uri: string;
    title: string;
  };
}

export interface MapBoundsCoordinates {
  southWest: Coordinates;
  northEast: Coordinates;
}

export interface SearchCriteria {
  text?: string;
  eventDateStart?: string;
  eventDateEnd?: string;
  createdAtStart?: string;
  createdAtEnd?: string;
  companions?: string[];
  mapBounds?: MapBoundsCoordinates | null;
}

// For Admin Dashboard Statistics
export interface UserShareActivity {
  userId: string;
  username: string;
  handle?: string;
  avatarUrl?: string; // Added for display
  firstName?: string;
  lastName?: string;
  shareCount?: number; // How many items they shared
  receiveCount?: number; // How many items they received
}

export interface UserActivityStat {
  user: User; // Full user object for display
  memoriesCreatedCount: number;
  chronicleEventsCreatedCount: number;
  sharedItemCount: number; // Total items this user has shared
  sharedWithUsers: UserShareActivity[]; // Distinct users this user has shared items with
  receivedShareCount: number; // Total items shared with this user
}

export interface AdminDashboardStats {
  totalUsers: number; // Non-admin users
  totalActiveUsers: number; // Placeholder, could be based on recent activity
  totalMemories: number;
  totalChronicleEvents: number;
  userActivityStats: UserActivityStat[];
  totalSharedMemories: number;
  totalSharedChronicleEvents: number;
  percentageSharedMemories: number; // 0-100
  percentageSharedChronicleEvents: number; // 0-100
  averageItemsPerUser: number; // Memories + Chronicles per non-admin user
  mostActiveSharer?: UserShareActivity; // User who shared the most items
  mostFrequentRecipient?: UserShareActivity; // User who received the most items
}

// --- Chat Types ---
export type ChatMessageType = 'text' | 'image' | 'gif' | 'file' | 'memory' | 'chronicle';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  type: ChatMessageType;
  text?: string; // For 'text' type or as fallback/description
  fileUrl?: string; // For 'image', 'gif', 'file' types (dataUrl in mock)
  fileName?: string; // For 'file' type
  fileType?: string; // MIME type, for 'file' or 'image'
  fileSize?: number; // For 'file' or 'image'
  timestamp: string; // ISO string
  isRead: boolean;

  // For shared items in chat
  linkedItemId?: string;
  linkedItemTitle?: string;

  // New fields for edit, delete, reply, forward
  isEdited?: boolean;
  isDeleted?: boolean; // If true, 'text' might be replaced with a placeholder like "[پیام حذف شد]"
  originalMessageId?: string; // For replies: ID of the message being replied to
  originalMessageText?: string; // For replies: Snippet or full text of the original message
  originalMessageSenderId?: string; // For replies: Sender ID of the original message
  forwardedFromUserId?: string; // For forwarded messages: User ID of the original sender
}

export interface ChatConversation {
  id: string;
  participants: [string, string];
  lastMessageText?: string; // Can be actual text or a placeholder like "📷 تصویر", "[پیام حذف شد]"
  lastMessageType?: ChatMessageType; // To help display in sidebar
  lastMessageTimestamp: string;
  lastMessageSenderId?: string;
  unreadCounts: { [userId: string]: number };
}

// Added for Chat Management in Admin Panel
export interface ChatSettings {
  allowEdit: boolean;
  allowDelete: boolean;
  allowForward: boolean;
  allowFileUpload: boolean;
}

export interface UserChatSettings {
  userId: 'global' | string;
  settings: Partial<ChatSettings>;
}


export interface ForwardMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageToForward: ChatMessage;
  currentUser: User;
  allUsers: User[];
  conversations: ChatConversation[];
  onConfirmForward: (targetConversationId: string) => Promise<void>;
  onViewUserProfile: (user: User) => void;
}

export interface ChronicleDetailModalProps {
  event: ChronicleEvent;
  onClose: () => void;
  currentUser: User;
  allUsers: User[];
  onViewUserProfile: (user: User) => void;
}

// Search criteria for the new chronicle timeline page
export interface ChronicleSearchCriteria {
  text?: string;
  eventDateStart?: string;
  eventDateEnd?: string;
  createdAtStart?: string;
  createdAtEnd?: string;
}