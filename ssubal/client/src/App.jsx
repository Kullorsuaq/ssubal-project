import { useEffect, useContext } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';

import MainLayout from './layouts/MainLayout';
import ChatLayout from './layouts/ChatLayout';
import Home from './pages/Home';
import Kakao from './pages/auth/Kakao';
import Signup from './pages/auth/Signup';
import GroupSearch from './pages/group/GroupSearch';
import CreateGroup from './pages/group/CreateGroup';
import PostList from './pages/post/PostList';
import PostDetail from './pages/post/PostDetail';
import PostEditor from './pages/post/PostEditor';
import Schedule from './pages/schedule/Schedule';
import MemberList from './pages/chat/MemberList';
import ChatList from './pages/chat/ChatList';
import ChatRoom from './pages/chat/ChatRoom';
import MyPage from './pages/mypage/MyPage';
import UserProfile from './pages/UserProfile';
import Popup from './components/Popup';

import { AuthProvider } from './contexts/AuthContext';
import { PopupProvider } from './contexts/PopupContext';
import { ChatProvider } from './contexts/ChatContext';
import { NotificationContext, NotificationProvider } from './contexts/NotificationContext';

function AppContent() {
  const navigate = useNavigate();
  const { notifications, setNotifications, setHasUnread, readNotification } = useContext(NotificationContext);

  useEffect(() => {
    const handleMessageFromApp = async (event) => {
      try {
        let message = event.data;
        while (typeof message === 'string') {
          message = JSON.parse(message);
        }

        const { groupId, postId, notiId, type } = message;

        if (notiId) {
          try {
            readNotification(notiId);
          } catch (error) {
            console.error("푸시 알림 읽음 처리 실패:", error);
          }
        }

        if (type === 'NEW_COMMENT' || type === 'POST_SUB_ACCEPT' || type === 'POST_SUB_APPLY') {
          if (groupId && postId) {
            navigate(`/groups/${groupId}/posts/${postId}`);
          }
        } else if (type === 'SCHEDULE_UPDATE') {
          if (groupId) {
            navigate(`/groups/${groupId}/schedules`);
          }
        }

      } catch (error) {
        console.error("앱 신호 파싱 에러", error);
      }
    };

    window.addEventListener('message', handleMessageFromApp);
    document.addEventListener('message', handleMessageFromApp);

    return () => {
      window.removeEventListener('message', handleMessageFromApp);
      document.removeEventListener('message', handleMessageFromApp);
    };
  }, [navigate, readNotification]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/auth">
        <Route path="callback/kakao" element={<Kakao />} />
        <Route path="signup" element={<Signup />} />
      </Route>

      <Route path="/groups/search" element={<GroupSearch />} />
      <Route path="/groups/create" element={<CreateGroup />} />

      <Route element={<MainLayout />}>         
        <Route path="/groups/:groupId" element={<Home />} />
        <Route path="/groups/:groupId/posts" element={<PostList />} />
        <Route path="/groups/:groupId/posts/create" element={<PostEditor />} />
        <Route path="/groups/:groupId/posts/:postId" element={<PostDetail />} />
        <Route path="/groups/:groupId/posts/:postId/edit" element={<PostEditor />} />
        <Route path="/groups/:groupId/schedules" element={<Schedule />} />
        <Route path="/groups/:groupId/members" element={<MemberList />} />
        <Route path="/groups/:groupId/members/:userId" element={<UserProfile />} />
        <Route path="/groups/:groupId/mypage" element={<MyPage />} />
      </Route>

      <Route path="/groups/:groupId/chats" element={<ChatLayout />}>
        <Route index element={<ChatList />} />
        <Route path=":roomId" element={<ChatRoom />} />
      </Route>
    </Routes>
  );
}

//최상위 App 컴포넌트는 Provider로만 감싸줌
function App() {
  return (
    <PopupProvider>
      <AuthProvider>
        <NotificationProvider>
          <ChatProvider>
            <Popup />
            <AppContent />
          </ChatProvider>
        </NotificationProvider>
      </AuthProvider>
    </PopupProvider>
  );
}

export default App;