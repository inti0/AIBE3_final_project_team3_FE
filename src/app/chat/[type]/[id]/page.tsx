"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useChatMessagesQuery, useLeaveChatRoom } from "@/global/api/useChatQuery";
import { getStompClient, connect, disconnect } from "@/global/stomp/stompClient";
import { useLoginStore } from "@/global/stores/useLoginStore";
import { MessageResp } from "@/global/types/chat.types";
import type { IMessage } from "@stomp/stompjs";

export default function ChatRoomPage() {
  const params = useParams();
  const chatRoomType = params.type as string;
  const roomId = Number(params.id);
  const member = useLoginStore((state) => state.member);

  const { data, isLoading, error } = useChatMessagesQuery(roomId, chatRoomType);
  const [messages, setMessages] = useState<MessageResp[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationOn, setIsNotificationOn] = useState(true);

  const leaveChatRoomMutation = useLeaveChatRoom();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (data?.messages) {
      setMessages(data.messages);
    }
  }, [data]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!roomId || !member || !chatRoomType) return;

    const { accessToken } = useLoginStore.getState();
    if (!accessToken) {
      console.error("Access token is not available. Cannot connect to STOMP.");
      return;
    }

    let subscription: any;

    connect(accessToken, () => {
      const client = getStompClient();
      const destination = `/topic/${chatRoomType}/rooms/${roomId}`;
      subscription = client.subscribe(
        destination,
        (message: IMessage) => {
          const receivedMessage: MessageResp = JSON.parse(message.body);
          setMessages((prevMessages) => [...prevMessages, receivedMessage]);
        }
      );
      console.log(`Subscribed to ${destination}`);
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
        console.log(`Unsubscribed from /topic/${chatRoomType}/rooms/${roomId}`);
      }
      disconnect();
    };
  }, [roomId, member, chatRoomType]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (newMessage.trim() === "" || !member) {
      return;
    }

    const client = getStompClient();

    if (client.connected) {
      client.publish({
        destination: "/app/chats/sendMessage",
        body: JSON.stringify({
          roomId: roomId,
          content: newMessage,
          messageType: "TEXT",
          chatRoomType: chatRoomType.toUpperCase(),
        }),
      });
      setNewMessage("");
    } else {
      console.error("Client is not connected.");
      alert("웹소켓 연결이 활성화되지 않았습니다. 페이지를 새로고침 해주세요.");
    }
  };

  const handleLeaveChatRoom = () => {
    if (window.confirm("정말로 이 채팅방을 나가시겠습니까?")) {
      leaveChatRoomMutation.mutate({ roomId, chatRoomType });
    }
  };

  if (isLoading || !member) {
    return <div className="text-center text-white p-8">Loading Chat Room...</div>;
  }
  if (error) return <div className="text-center text-red-400 p-8">Error: {error.message}</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
        <h1 className="text-xl font-bold text-white">Chat Room #{roomId} ({chatRoomType})</h1>
        <div className="relative">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg z-10">
              <ul className="py-1 text-white">
                <li>
                  <button onClick={() => setIsNotificationOn(!isNotificationOn)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-600 flex items-center">
                    <span className="mr-2 text-xl">{isNotificationOn ? '🔔' : '🔕'}</span>
                    알림
                  </button>
                </li>
                <li><a href="#" className="block px-4 py-2 text-sm hover:bg-gray-600">사진/동영상</a></li>
                <li><a href="#" className="block px-4 py-2 text-sm hover:bg-gray-600">파일</a></li>
                <li><a href="#" className="block px-4 py-2 text-sm hover:bg-gray-600">채팅방 인원</a></li>
                <li><a href="#" className="block px-4 py-2 text-sm hover:bg-gray-600">차단하기</a></li>
                <li><a href="#" className="block px-4 py-2 text-sm hover:bg-gray-600">신고하기</a></li>
                <li>
                  <button onClick={handleLeaveChatRoom} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-600 text-red-400">
                    채팅방 나가기
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${
              msg.senderId === member?.memberId ? "justify-end" : "justify-start"
            }`}
          >
            {msg.senderId !== member?.memberId && (
              <div className="w-8 h-8 rounded-full bg-gray-600 flex-shrink-0"></div>
            )}
            <div
              className={`max-w-md p-3 rounded-lg ${
                msg.senderId === member?.memberId
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-700 text-gray-200"
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              <p className="text-xs opacity-70 mt-1 text-right">{new Date(msg.createdAt).toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:bg-gray-500"
            disabled={!newMessage.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

