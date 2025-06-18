<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { goto } from '$app/navigation';
    import { 
        Send,
        Search,
        Phone,
        Video,
        MoreVertical,
        Paperclip,
        Smile,
        Home,
        Heart,
        MessageSquare,
        Settings,
        User,
        Calendar,
        LogOut,
        Menu,
        X,
        Check,
        CheckCheck,
        Camera,
        Image as ImageIcon,
        Info,
        Plus
    } from 'lucide-svelte';
    import { socketService, socketConnected, socketMessages, socketError, typingUsers, unreadCounts } from '$lib/socket-client';

    let user: any = null;
    let conversations: any[] = [];
    let availableAgents: any[] = [];
    let activeConversation: any = null;
    let messages: any[] = [];
    let newMessage = '';
    let searchTerm = '';
    let loading = true;
    let loadingAgents = false;
    let sidebarOpen = false;
    let currentPage = 'messages';
    let savedProperties: any[] = [];
    let viewingRequests: any[] = [];
    let isTyping = false;
    let typingTimer: ReturnType<typeof setTimeout> | null = null;
    let fileInput: HTMLInputElement;
    let showNewChatModal = false;

    onMount(() => {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (!userData || !token) {
            goto('/login');
            return;
        }
        
        user = JSON.parse(userData);
        
        // Initialize Socket.IO connection
        socketService.connect();
        
        loadConversations();
        loadAvailableAgents();
        loadDashboardData();

        // Subscribe to real-time messages
        const unsubscribeMessages = socketMessages.subscribe((newMessages) => {
            if (newMessages.length > 0) {
                // Update conversations with new messages
                loadConversations();
                
                // If active conversation matches, update messages
                if (activeConversation) {
                    loadMessages(activeConversation.id);
                }
            }
        });

        return () => {
            unsubscribeMessages();
        };
    });

    onDestroy(() => {
        socketService.disconnect();
    });

    async function loadConversations() {
        try {
            loading = true;
            const token = localStorage.getItem('token');
            const response = await fetch('/api/messages/conversations', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                
                // Map the API response to match the expected format
                conversations = (data.conversations || []).map((conv: any) => {
                    // Determine who is the other participant
                    const isInitiator = conv.initiatorId === user.id;
                    const otherParticipant = isInitiator ? conv.receiver : conv.initiator;
                    
                    return {
                        id: conv.id,
                        subject: conv.subject || 'Chat',
                        lastMessage: conv.messages?.[0]?.content || 'No messages yet',
                        lastMessageAt: conv.messages?.[0]?.createdAt || conv.createdAt,
                        unreadCount: 0,
                        participants: [
                            {
                                id: user.id,
                                fullName: user.fullName || user.name,
                                isOnline: true
                            },
                            {
                                id: otherParticipant.id,
                                fullName: otherParticipant.fullName || otherParticipant.email,
                                role: otherParticipant.role,
                                isOnline: false // TODO: Get real online status
                            }
                        ],
                        canReceiverReply: conv.canReceiverReply !== false,
                        adminRestricted: conv.adminRestricted || false
                    };
                });
                
            } else {
                console.error('Failed to load conversations:', response.status);
                conversations = [];
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
            conversations = [];
        } finally {
            loading = false;
        }
    }

    async function loadAvailableAgents() {
        try {
            loadingAgents = true;
            const token = localStorage.getItem('token');
            const response = await fetch('/api/messages/participants', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                availableAgents = data.participants || [];
            } else {
                console.error('Failed to load agents:', response.status);
                availableAgents = [];
            }
        } catch (error) {
            console.error('Error loading agents:', error);
            availableAgents = [];
        } finally {
            loadingAgents = false;
        }
    }

    async function startNewConversation(agent: any) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/messages/conversation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    participantId: agent.id,
                    subject: `Chat with ${agent.fullName || agent.email}`
                })
            });

            if (response.ok) {
                const data = await response.json();
                const conversation = data.conversation;
                
                // Add to conversations list if not already there
                const existingIndex = conversations.findIndex(c => c.id === conversation.id);
                if (existingIndex === -1) {
                    conversations = [conversation, ...conversations];
                } else {
                    conversations[existingIndex] = conversation;
                }
                
                // Select the conversation
                activeConversation = conversation;
                socketService.joinConversation(conversation.id.toString());
                await loadMessages(conversation.id.toString());
                
                showNewChatModal = false;
            } else {
                console.error('Failed to create conversation:', response.status);
            }
        } catch (error) {
            console.error('Error creating conversation:', error);
        }
    }

    async function loadDashboardData() {
        savedProperties = [];
        viewingRequests = [];
    }

    async function selectConversation(conversation: any) {
        activeConversation = conversation;
        
        // Join conversation room via Socket.IO
        socketService.joinConversation(conversation.id.toString());
        
        // Load conversation messages from API
        await loadMessages(conversation.id.toString());
        
        // Mark conversation as read
        socketService.markConversationAsRead(conversation.id.toString());
    }

    async function loadMessages(conversationId: string) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/messages/${conversationId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                
                // Map messages to match expected format
                messages = (data.messages || []).map((msg: any) => ({
                    ...msg,
                    timestamp: msg.createdAt,
                    senderId: msg.senderId
                }));
                
                // Update conversation reply permissions
                if (activeConversation && data.conversation) {
                    activeConversation.canReceiverReply = data.conversation.canReceiverReply;
                    activeConversation.adminRestricted = data.conversation.adminRestricted;
                }
            } else {
                console.error('Failed to load messages:', response.status);
                messages = [];
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            messages = [];
        }
    }

    async function sendMessage() {
        if (!newMessage.trim() || !activeConversation) return;

        const messageContent = newMessage.trim();
        const tempMessage = {
            id: Date.now(),
            conversationId: activeConversation.id.toString(),
            senderId: user.id,
            content: messageContent,
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            sender: {
                id: user.id,
                fullName: user.fullName || user.name,
                email: user.email,
                role: user.role
            }
        };

        // Add message immediately to UI
        messages = [...messages, tempMessage];
        newMessage = '';

        try {
            // Send via API
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/messages/${activeConversation.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    content: messageContent
                })
            });

            if (!response.ok) {
                console.error('Failed to send message:', response.status);
                // Remove the optimistic message on failure
                messages = messages.filter(m => m.id !== tempMessage.id);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            // Remove the optimistic message on failure
            messages = messages.filter(m => m.id !== tempMessage.id);
        }

        // Stop typing indicator
        if (isTyping) {
            socketService.stopTyping(activeConversation.id.toString());
            isTyping = false;
        }
    }

    function handleTyping() {
        if (!activeConversation) return;

        if (!isTyping) {
            isTyping = true;
            socketService.startTyping(activeConversation.id.toString());
        }

        // Reset typing timer
        if (typingTimer) {
            clearTimeout(typingTimer);
        }

        typingTimer = setTimeout(() => {
            if (isTyping) {
                isTyping = false;
                socketService.stopTyping(activeConversation.id.toString());
            }
        }, 2000);
    }

    function getAgentResponse(userMessage: string): string {
        const responses = [
            "That's a great question! Let me help you with that.",
            "I understand what you're looking for. Let me show you some options.",
            "Absolutely! I have some properties that might interest you.",
            "That sounds perfect! I can definitely help you find something like that.",
            "Great choice! Let me provide you with more details about that area.",
            "I'd be happy to schedule a viewing for you. When would work best?",
            "That's within a good budget range. I have several options to show you."
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    function updateConversationLastMessage(message: any) {
        conversations = conversations.map(conv => 
            conv.id === message.conversationId 
                ? { ...conv, lastMessage: message, lastMessageAt: message.timestamp }
                : conv
        );
    }

    function formatTime(timestamp: string) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function formatDate(timestamp: string) {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString();
        }
    }

    function getMessageStatus(message: any) {
        if (message.senderId !== user.id) return null;
        return message.status || 'sent';
    }

    function triggerFileUpload() {
        fileInput?.click();
    }

    function handleFileSelect(event: Event) {
        const target = event.target as HTMLInputElement;
        const files = target.files;
        if (files && files.length > 0) {
            const file = files[0];
            console.log('File selected:', file.name);
        }
    }

    function logout() {
        // socketService.disconnect();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        goto('/');
    }

    function toggleSidebar() {
        sidebarOpen = !sidebarOpen;
    }

    function closeSidebar() {
        sidebarOpen = false;
    }

    $: filteredConversations = conversations.filter(conv => {
        if (!searchTerm) return true;
        
        // Find the other participant (not the current user)
        const otherParticipant = conv.participants?.find((p: any) => p.id !== user.id);
        if (!otherParticipant) return false;
        
        return otherParticipant.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               conv.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    });
</script>

<svelte:head>
    <title>Messages - Houserz</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50">
    <div class="flex h-screen">
        <!-- Mobile Menu Button -->
        <div class="fixed top-4 left-4 z-50 lg:hidden">
            <button
                on:click={toggleSidebar}
                class="rounded-lg bg-white p-2 text-gray-600 shadow-lg hover:text-gray-900"
            >
                {#if sidebarOpen}
                    <X class="h-6 w-6" />
                {:else}
                    <Menu class="h-6 w-6" />
                {/if}
            </button>
        </div>

        <!-- Sidebar Overlay -->
        {#if sidebarOpen}
            <div class="bg-opacity-50 fixed inset-0 z-30 bg-black lg:hidden" on:click={closeSidebar}></div>
        {/if}

        <!-- Sidebar -->
        <div class="
            {sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            fixed z-40 h-full w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out
            md:w-[50%] lg:static lg:w-64 lg:translate-x-0
        ">
            <div class="flex h-screen flex-col justify-between py-4">
                <div class="flex h-full flex-col justify-between">
                    <div>
                        <!-- User Profile -->
                        <div class="border-b border-gray-200 p-4">
                            <div class="flex flex-col items-center justify-center space-x-3">
                                <div class="flex h-14 w-14 items-center justify-center rounded-full bg-green-500">
                                    <span class="flex justify-center text-sm font-semibold text-white">
                                        {(user?.full_name || user?.name || 'U').charAt(0)?.toUpperCase()}
                                    </span>
                                </div>
                                <div class="min-w-0 flex-1 flex-col justify-center">
                                    <p class="flex justify-center truncate text-xs text-gray-500">Welcome back!</p>
                                    <p class="flex justify-center truncate text-sm font-bold text-gray-900 md:text-base">
                                        {user?.full_name || user?.name || 'User'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Navigation -->
                    <nav class="flex-1 space-y-1 px-2 py-4 flex flex-col space-y-4">
						<a
							href="/dashboard"
							class="flex items-center rounded-lg px-3 py-2 text-sm font-medium {currentPage === 'dashboard' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'}"
							on:click={() => { closeSidebar(); }}
						>
							<Home class="mr-3 h-5 w-5" />
							Dashboard
						</a>

						<a
							href="/dashboard/properties"
							class="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
							on:click={() => { closeSidebar(); goto('/dashboard/properties'); }}
						>
							<Search class="mr-3 h-5 w-5" />
							Properties
						</a>

						<a
							href="/dashboard/favorites"
							class="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
							on:click={() => { closeSidebar(); goto('/dashboard/favorites'); }}
						>
							<Heart class="mr-3 h-5 w-5" />
							<span class="hidden sm:inline">Saved Properties</span>
							<span class="sm:hidden">Saved</span>
							{#if savedProperties.length > 0}
								<span class="ml-auto rounded-full bg-green-500 px-2 py-1 text-xs text-white">
									{savedProperties.length}
								</span>
							{/if}
						</a>

						<a
							href="/dashboard/messages"
							class="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
							on:click={() => { closeSidebar(); goto('/dashboard/messages'); }}
						>
							<MessageSquare class="mr-3 h-5 w-5" />
							Messages
							{#if messages.some((m) => m.unread)}
								<span class="ml-auto rounded-full bg-red-500 px-2 py-1 text-xs text-white">
									{messages.filter((m) => m.unread).length}
								</span>
							{/if}
						</a>

						<a
							href="/dashboard/profile"
							class="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
							on:click={() => { closeSidebar(); goto('/dashboard/profile'); }}
						>
							<User class="mr-3 h-5 w-5" />
							Profile
						</a>
					</nav>
                </div>

                <!-- Logout -->
                <div class="border-t border-gray-200 p-4">
                    <button on:click={logout} class="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                        <LogOut class="mr-3 h-5 w-5" />
                        Logout
                    </button>
                </div>
            </div>
        </div>

        <!-- Chat Interface -->
        <div class="flex flex-1 lg:ml-0 bg-white">
            <!-- Conversations List -->
            <div class="w-full md:w-80 lg:w-96 bg-white border-r border-gray-200 flex flex-col {activeConversation ? 'hidden md:flex' : 'flex'}">
                <!-- Header -->
                <div class="px-6 py-4 border-b border-gray-200 bg-white">
                    <div class="flex items-center justify-between mb-4">
                        <h1 class="text-xl font-semibold text-gray-900">Messages</h1>
                        <div class="flex items-center space-x-2">
                            <button 
                                on:click={() => showNewChatModal = true}
                                class="p-2 text-green-600 hover:text-green-700 rounded-lg hover:bg-green-50"
                                title="Start new chat"
                            >
                                <Plus class="h-5 w-5" />
                            </button>
                            <button class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                                <MoreVertical class="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                    <div class="relative">
                        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            bind:value={searchTerm}
                            class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 text-sm"
                        />
                    </div>
                </div>

                <!-- Conversations -->
                <div class="flex-1 overflow-y-auto">
                    {#if loading}
                        <div class="flex items-center justify-center py-12">
                            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                        </div>
                    {:else if filteredConversations.length === 0}
                        <div class="flex flex-col items-center justify-center py-12 px-6 text-center">
                            <MessageSquare class="h-16 w-16 text-gray-300 mb-4" />
                            <h3 class="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
                            <p class="text-gray-500 text-sm">Start a conversation with an agent or property owner</p>
                        </div>
                    {:else}
                        {#each filteredConversations as conversation}
                            <button
                                on:click={() => selectConversation(conversation)}
                                class="w-full px-6 py-4 hover:bg-gray-50 text-left border-b border-gray-100 transition-colors {
                                    activeConversation?.id === conversation.id ? 'bg-green-50 border-green-200' : ''
                                }"
                            >
                                <div class="flex items-start space-x-3">
                                    <div class="relative flex-shrink-0">
                                        <div class="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-sm">
                                            <span class="text-white text-sm font-semibold">
                                                {conversation.participants.find((p: any) => p.id !== user.id)?.fullName?.charAt(0) || 'A'}
                                            </span>
                                        </div>
                                        {#if conversation.participants.find((p: any) => p.id !== user.id)?.isOnline}
                                            <div class="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                                        {/if}
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-center justify-between mb-1">
                                            <p class="text-sm font-semibold text-gray-900 truncate">
                                                {conversation.participants.find((p: any) => p.id !== user.id)?.fullName || 'Agent'}
                                            </p>
                                            <span class="text-xs text-gray-500">
                                                {conversation.lastMessageAt ? formatTime(conversation.lastMessageAt) : ''}
                                            </span>
                                        </div>
                                        <p class="text-sm text-gray-600 truncate">
                                            {conversation.lastMessage || 'No messages yet'}
                                        </p>
                                        {#if conversation.unreadCount > 0}
                                            <div class="flex items-center justify-between mt-2">
                                                <span></span>
                                                <span class="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                                    {conversation.unreadCount}
                                                </span>
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            </button>
                        {/each}
                    {/if}
                </div>
            </div>

            <!-- Chat Area -->
            {#if activeConversation}
                <div class="flex-1 flex flex-col bg-white {activeConversation ? 'flex' : 'hidden md:flex'}">
                    <!-- Chat Header -->
                    <div class="px-6 py-4 border-b border-gray-200 bg-white">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <button 
                                    class="md:hidden p-2 text-gray-400 hover:text-gray-600"
                                    on:click={() => activeConversation = null}
                                >
                                    <X class="h-5 w-5" />
                                </button>
                                <div class="relative">
                                    <div class="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                                        <span class="text-white text-sm font-medium">
                                            {activeConversation.participants.find((p: any) => p.id !== user.id)?.fullName?.charAt(0) || 'A'}
                                        </span>
                                    </div>
                                    {#if activeConversation.participants.find((p: any) => p.id !== user.id)?.isOnline}
                                        <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                                    {/if}
                                </div>
                                <div>
                                    <h2 class="text-lg font-semibold text-gray-900">
                                        {activeConversation.participants.find((p: any) => p.id !== user.id)?.fullName || 'Agent'}
                                    </h2>
                                    <p class="text-sm text-gray-500">
                                        {activeConversation.participants.find((p: any) => p.id !== user.id)?.isOnline ? 'Online' : 'Last seen recently'}
                                    </p>
                                </div>
                            </div>
                            <div class="flex items-center space-x-2">
                                <button class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                                    <Phone class="h-5 w-5" />
                                </button>
                                <button class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                                    <Video class="h-5 w-5" />
                                </button>
                                <button class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                                    <MoreVertical class="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Messages -->
                    <div class="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                        {#if messages.length === 0}
                            <div class="flex items-center justify-center h-full">
                                <div class="text-center">
                                    <MessageSquare class="w-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <p class="text-gray-500 text-sm">No messages yet</p>
                                    <p class="text-gray-400 text-xs mt-1">Start the conversation by sending a message</p>
                                </div>
                            </div>
                        {:else}
                            {#each messages as message, index}
                                {#if index === 0 || formatDate(messages[index - 1].timestamp || messages[index - 1].createdAt) !== formatDate(message.timestamp || message.createdAt)}
                                    <div class="flex justify-center my-4">
                                        <span class="bg-white px-3 py-1 rounded-full text-xs text-gray-500 shadow-sm">
                                            {formatDate(message.timestamp || message.createdAt)}
                                        </span>
                                    </div>
                                {/if}
                                
                                <div class="flex {message.senderId === user.id ? 'justify-end' : 'justify-start'}">
                                    <div class="max-w-xs lg:max-w-md">
                                        {#if message.senderId !== user.id}
                                            <div class="flex items-end space-x-2">
                                                <div class="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <span class="text-white text-xs font-medium">
                                                        {message.sender?.fullName?.charAt(0) || 'A'}
                                                    </span>
                                                </div>
                                                <div class="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                                                    <p class="text-sm text-gray-900">{message.content}</p>
                                                    <p class="text-xs text-gray-500 mt-1">{formatTime(message.timestamp || message.createdAt)}</p>
                                                </div>
                                            </div>
                                        {:else}
                                            <div class="bg-green-500 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-sm">
                                                <p class="text-sm">{message.content}</p>
                                                <div class="flex items-center justify-end mt-1 space-x-1">
                                                    <span class="text-xs text-green-100">{formatTime(message.timestamp || message.createdAt)}</span>
                                                    <div class="flex items-center">
                                                        {#if getMessageStatus(message) === 'sent'}
                                                            <Check class="h-3 w-3 text-green-100" />
                                                        {:else if getMessageStatus(message) === 'delivered'}
                                                            <CheckCheck class="h-3 w-3 text-green-100" />
                                                        {:else if getMessageStatus(message) === 'read'}
                                                            <CheckCheck class="h-3 w-3 text-white" />
                                                        {/if}
                                                    </div>
                                                </div>
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            {/each}
                        {/if}

                        {#if typingUsers.length > 0}
                            <div class="flex justify-start">
                                <div class="flex items-end space-x-2">
                                    <div class="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                                        <span class="text-white text-xs">A</span>
                                    </div>
                                    <div class="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                                        <div class="flex space-x-1">
                                            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                                            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        {/if}
                    </div>

                    <!-- Message Input -->
                    <div class="px-6 py-4 border-t border-gray-200 bg-white">
                        {#if activeConversation && !activeConversation.canReceiverReply}
                            <!-- Admin message - no reply allowed -->
                            <div class="text-center py-3 px-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <p class="text-sm text-amber-700">
                                    <Info class="h-4 w-4 inline mr-1" />
                                    This is an administrative message. Replies are not permitted.
                                </p>
                            </div>
                        {:else}
                            <form on:submit|preventDefault={sendMessage} class="flex items-end space-x-3">
                                <input
                                    type="file"
                                    bind:this={fileInput}
                                    on:change={handleFileSelect}
                                    class="hidden"
                                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                                />
                                <button 
                                    type="button" 
                                    on:click={triggerFileUpload}
                                    class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                                >
                                    <Paperclip class="h-5 w-5" />
                                </button>
                                <div class="flex-1 relative">
                                    <input
                                        type="text"
                                        bind:value={newMessage}
                                        on:input={handleTyping}
                                        placeholder="Type a message..."
                                        class="w-full px-4 py-3 pr-12 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none bg-gray-50"
                                    />
                                    <button 
                                        type="button" 
                                        class="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                                    >
                                        <Smile class="h-5 w-5" />
                                    </button>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    class="p-3 bg-green-500 text-white rounded-2xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                >
                                    <Send class="h-5 w-5" />
                                </button>
                            </form>
                        {/if}
                    </div>
                </div>
            {:else}
                <div class="flex-1 hidden md:flex items-center justify-center bg-gray-50">
                    <div class="text-center">
                        <div class="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageSquare class="h-12 w-12 text-green-500" />
                        </div>
                        <h3 class="text-xl font-semibold text-gray-900 mb-2">Welcome to Houserz Messages</h3>
                        <p class="text-gray-600 max-w-md">Select a conversation from the sidebar to start chatting with agents and property owners</p>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>

<!-- New Chat Modal -->
{#if showNewChatModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" on:click={() => showNewChatModal = false}>
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" on:click|stopPropagation>
            <div class="px-6 py-4 border-b border-gray-200">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-gray-900">Start New Chat</h3>
                    <button 
                        on:click={() => showNewChatModal = false}
                        class="text-gray-400 hover:text-gray-600"
                    >
                        <X class="h-5 w-5" />
                    </button>
                </div>
            </div>
            
            <div class="px-6 py-4">
                {#if loadingAgents}
                    <div class="flex items-center justify-center py-8">
                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                    </div>
                {:else if availableAgents.length === 0}
                    <div class="text-center py-8">
                        <User class="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p class="text-gray-500">No agents available</p>
                    </div>
                {:else}
                    <div class="space-y-2 max-h-64 overflow-y-auto">
                        {#each availableAgents as agent}
                            <button
                                on:click={() => startNewConversation(agent)}
                                class="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 text-left"
                            >
                                <div class="relative flex-shrink-0">
                                    <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                        <span class="text-white font-medium text-sm">
                                            {(agent.fullName || agent.email).charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    {#if agent.isOnline}
                                        <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                    {/if}
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="font-medium text-gray-900 truncate">
                                        {agent.fullName || agent.email}
                                    </p>
                                    <p class="text-sm text-gray-500 capitalize">
                                        {agent.role.toLowerCase()}
                                    </p>
                                </div>
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}