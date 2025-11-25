'use client';

import { useState } from 'react';

interface Report {
  id: string;
  reporterId: string;
  reporterNickname: string;
  targetNickname: string;
  category: 'ABUSE' | 'SCAM' | 'INAPPROPRIATE' | 'OTHER';
  content: string;
  status: 'WAITING' | 'REVIEWING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

const DUMMY_REPORTS: Report[] = [
  {
    id: '1',
    reporterId: 'user1',
    reporterNickname: '정직한_학생',
    targetNickname: '스팸봇',
    category: 'ABUSE',
    content: 'I will destroy your house',
    status: 'WAITING',
    createdAt: '2025-11-18',
  },
  {
    id: '2',
    reporterId: 'user2',
    reporterNickname: '착한_유저',
    targetNickname: '사기꾼',
    category: 'SCAM',
    content: 'Send me money and I will give you English lessons',
    status: 'REVIEWING',
    createdAt: '2025-11-17',
  },
];

const statusColors = {
  WAITING: 'bg-yellow-100 text-yellow-800',
  REVIEWING: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const categoryColors = {
  ABUSE: 'bg-red-100 text-red-800',
  SCAM: 'bg-orange-100 text-orange-800',
  INAPPROPRIATE: 'bg-pink-100 text-pink-800',
  OTHER: 'bg-gray-100 text-gray-800',
};

export default function ReportManagementPage() {
  const [reports, setReports] = useState(DUMMY_REPORTS);
  const [selected, setSelected] = useState<Report | null>(null);
  const [newStatus, setNewStatus] = useState<Report['status']>('WAITING');

  const updateStatus = (id: string) => {
    setReports(reports.map(r => r.id === id ? { ...r, status: newStatus } : r));
    setSelected(null);
  };

  return (
    <main className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">신고 관리</h1>

      {/* 신고 리스트 */}
      <div className="grid gap-4">
        {reports.map(report => (
          <div key={report.id} className="bg-white border rounded-lg p-4 shadow-sm">

            <div className="flex justify-between">
              <div>
                <div className="flex gap-2 mb-2">
                  <span className="text-sm font-semibold">ID: {report.id}</span>

                  <span
                    className={`px-2 py-1 rounded text-xs ${statusColors[report.status]}`}
                  >
                    {report.status}
                  </span>

                  <span
                    className={`px-2 py-1 rounded text-xs ${categoryColors[report.category]}`}
                  >
                    {report.category}
                  </span>
                </div>

                <p className="text-sm text-gray-700 mb-2">"{report.content}"</p>
                <p className="text-xs text-gray-400">{report.createdAt}</p>
              </div>

              <button
                onClick={() => {
                  setSelected(report);
                  setNewStatus(report.status);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                상태 변경
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 상세 패널 */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">

          {/* 배경 클릭 영역 */}
          <div
            className="flex-1 bg-black bg-opacity-50"
            onClick={() => setSelected(null)}
          />

          {/* 패널 */}
          <div className="w-[380px] bg-white flex flex-col shadow-2xl">

            {/* 헤더 */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">신고 상세 정보</h2>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* 신고자 정보 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">신고자</h3>
                <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                  <p>닉네임: {selected.reporterNickname}</p>
                  <p>ID: {selected.reporterId}</p>
                </div>
              </div>

              {/* 신고 대상 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">신고 대상</h3>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <p>닉네임: {selected.targetNickname}</p>
                </div>
              </div>

              {/* 내용 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">신고 내용</h3>
                <div className="bg-red-50 border border-red-200 p-3 rounded text-sm">
                  "{selected.content}"
                </div>
              </div>

              {/* 상태 변경 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">상태 변경</h3>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as Report["status"])}
                  className="w-full border px-3 py-2 rounded text-sm"
                >
                  <option value="WAITING">대기중</option>
                  <option value="REVIEWING">검토중</option>
                  <option value="APPROVED">승인됨</option>
                  <option value="REJECTED">거절됨</option>
                </select>
              </div>
            </div>

            {/* 푸터 */}
            <div className="border-t p-6 flex gap-3">
              <button
                onClick={() => setSelected(null)}
                className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={() => updateStatus(selected.id)}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                저장
              </button>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}
