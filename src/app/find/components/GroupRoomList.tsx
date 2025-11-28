"use client";

import { useGetPublicGroupChatRoomsQuery, useJoinGroupChat } from "@/global/api/useChatQuery";
import { GroupChatRoomResp } from "@/global/types/chat.types";
import { Users, Lock, Hash, MoreVertical } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLoginStore } from "@/global/stores/useLoginStore";

// Password Modal Component
const PasswordModal = ({
  isOpen,
  onClose,
  onSubmit
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
}) => {
  const [password, setPassword] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(password);
    setPassword("");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-white mb-4">비밀번호 입력</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="채팅방 비밀번호를 입력하세요"
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            autoFocus
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              확인
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Individual Group Room Card Component
const GroupRoomCard = ({ room }: { room: GroupChatRoomResp }) => {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const joinGroupChat = useJoinGroupChat();
  const { role } = useLoginStore();

  const handleJoinRoom = () => {
    if (room.hasPassword) {
      setIsPasswordModalOpen(true);
    } else {
      joinGroupChat.mutate({ roomId: room.id });
    }
  };

  const handlePasswordSubmit = (password: string) => {
    setIsPasswordModalOpen(false);
    joinGroupChat.mutate({ roomId: room.id, password });
  };

  const handleCloseRoom = () => {
    if (confirm("정말 이 채팅방을 폐쇄하시겠습니까?")) {
      console.log("방 폐쇄:", room.id);
      // TODO: API 호출 - useCloseGroupChat() 같은 mutation 사용
      setIsMenuOpen(false);
    }
  };

  // 메뉴 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isMenuOpen]);

  return (
    <>
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 flex flex-col justify-between hover:border-emerald-500 transition-all duration-300 relative">
        {/* 헤더 + 메뉴 버튼 */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white break-all">{room.name}</h3>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {room.hasPassword && <Lock size={16} className="text-gray-400" />}
            
            {/* 관리자만 메뉴 보이기 */}
            {role === "ROLE_ADMIN" && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
                aria-label="메뉴"
              >
                <MoreVertical size={18} className="text-gray-400" />
              </button>

              {/* 드롭다운 메뉴 */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-10">
                  <button
                    onClick={handleCloseRoom}
                    className="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-800 rounded-lg transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    방 폐쇄하기
                  </button>
                </div>
              )}
            </div>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-400 mb-3 line-clamp-2 h-[40px]">{room.description || "채팅방 설명이 없습니다."}</p>
        <div className="flex items-center text-xs text-gray-400 mb-4">
          <Hash size={14} className="mr-1" />
          <span>{room.topic || "자유 주제"}</span>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center text-sm text-gray-300">
            <Users size={16} className="mr-2" />
            <span>{room.memberCount} / 50</span>
          </div>
          <button
            onClick={handleJoinRoom}
            disabled={joinGroupChat.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {joinGroupChat.isPending ? "참가 중..." : "Join"}
          </button>
        </div>
      </div>

      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={handlePasswordSubmit}
      />
    </>
  );
};


// Main Component to Fetch and Display the List
export default function GroupRoomList() {
  const { data: rooms, isLoading, error } = useGetPublicGroupChatRoomsQuery();

  if (isLoading) {
    return (
      <div className="text-center text-white">
        <p>Loading group chats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-400">
        <p>Error loading groups: {error.message}</p>
      </div>
    );
  }

  if (!rooms || rooms.length === 0) {
    return (
      <div className="text-center text-gray-400">
        <p>No public group chats found. Why not create one?</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {rooms.map((room) => (
        <GroupRoomCard key={room.id} room={room} />
      ))}
    </div>
  );
}
