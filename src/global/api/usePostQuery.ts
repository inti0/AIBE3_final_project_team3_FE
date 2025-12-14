import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  PostSummary,
  PostDetail,
  PostCreateRequest,
  PostUpdateRequest,
  Comment,
  CommentCreateRequest,
  CommentUpdateRequest,
  LikeStatus,
  PageResponse,
  CustomResponse,
  PostSortType,
} from '@/global/types/post.types';
import { API_BASE_URL } from '@/global/consts';
import { useLoginStore } from '@/global/stores/useLoginStore';

// ==================== 게시글 API ====================

// 게시글 목록 조회
export const usePostsQuery = (sort: PostSortType = PostSortType.LATEST, page = 0, size = 20) => {
  return useQuery({
    queryKey: ['posts', sort, page, size],
    queryFn: async () => {
      const { accessToken: token } = useLoginStore.getState();
      console.log('게시판 API 호출:', `${API_BASE_URL}/api/v1/posts?sort=${sort}&page=${page}&size=${size}`);
      console.log('토큰:', token ? '있음' : '없음');
      
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/v1/posts?sort=${sort}&page=${page}&size=${size}`,
        {
          method: 'GET',
          headers,
          credentials: 'include',
        },
      );
      
      console.log('응답 상태:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 에러 응답:', errorText);
        throw new Error(`게시글 목록 조회 실패 (${response.status}): ${errorText}`);
      }
      
      const result: CustomResponse<PageResponse<PostSummary>> = await response.json();
      console.log('API 응답 데이터:', result);
      return result.data;
    },
  });
};

// 게시글 상세 조회
export const usePostQuery = (postId: number) => {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const { accessToken: token } = useLoginStore.getState();
      console.log('게시글 상세 API 호출:', `${API_BASE_URL}/api/v1/posts/${postId}`);
      console.log('토큰 상태:', token ? '있음' : '없음');
      console.log('토큰 값:', token);
      
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/v1/posts/${postId}`, {
        method: 'GET',
        headers,
        credentials: 'include',
      });
      
      console.log('게시글 상세 응답 상태:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('게시글 상세 API 에러:', errorText);
        throw new Error(`게시글 조회 실패 (${response.status}): ${errorText}`);
      }
      
      const result: CustomResponse<PostDetail> = await response.json();
      console.log('게시글 상세 데이터:', result);

      return result.data;
    },
    staleTime: 0, // Always refetch on mount
    refetchOnWindowFocus: false,
  });
};

// 게시글 작성
export const useCreatePostMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PostCreateRequest) => {
      const { accessToken: token } = useLoginStore.getState();
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('content', data.content);
      
      if (data.images && data.images.length > 0) {
        data.images.forEach((image) => {
          formData.append('images', image);
        });
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/posts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!response.ok) throw new Error('게시글 작성 실패');
      const result: CustomResponse<PostDetail> = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

// 게시글 수정
export const useUpdatePostMutation = (postId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PostUpdateRequest) => {
      const { accessToken: token } = useLoginStore.getState();
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('content', data.content);

      // 백엔드 스펙: removeImages는 string(true/false)
      // 기본값을 명시하지 않으면 서버 구현에 따라 기존 이미지가 사라질 수 있어 항상 전송합니다.
      formData.append('removeImages', data.removeImages ? 'true' : 'false');
      
      if (data.images && data.images.length > 0) {
        data.images.forEach((image) => {
          formData.append('images', image);
        });
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!response.ok) throw new Error('게시글 수정 실패');
      const result: CustomResponse<PostDetail> = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
};

// 게시글 삭제
export const useDeletePostMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: number) => {
      const { accessToken: token } = useLoginStore.getState();
      const response = await fetch(`${API_BASE_URL}/api/v1/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('게시글 삭제 실패');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

// 게시글 좋아요
export const useTogglePostLikeMutation = (postId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (isLiked: boolean) => {
      const { accessToken: token } = useLoginStore.getState();
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(`${API_BASE_URL}/api/v1/posts/${postId}/likes`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`좋아요 처리 실패: ${errorText}`);
      }
      const result: CustomResponse<LikeStatus> = await response.json();
      return result.data;
    },
    onMutate: async (isLiked: boolean) => {
      // 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ['post', postId] });

      // 이전 데이터 저장
      const previousPost = queryClient.getQueryData(['post', postId]);

      // 낙관적 업데이트
      queryClient.setQueryData(['post', postId], (old: PostDetail | undefined) => {
        if (!old) return undefined;
        return {
          ...old,
          isLiked: !isLiked,
          likeCount: isLiked ? old.likeCount - 1 : old.likeCount + 1,
        };
      });

      // 컨텍스트에 이전 데이터 반환
      return { previousPost };
    },
    onError: (err, variables, context) => {
      // 에러 발생 시 이전 데이터로 롤백
      if (context?.previousPost) {
        queryClient.setQueryData(['post', postId], context.previousPost);
      }
    },
    onSuccess: (data) => {
      if (!data) {
        return;
      }
      // 주의: 게시글 상세 GET이 조회수를 올리는 서버라면,
      // 좋아요 후 상세 쿼리를 refetch(invalidate)하면 조회수가 증가하는 버그가 생김.
      // 따라서 refetch 대신 캐시를 서버 응답으로만 동기화한다.
      queryClient.setQueryData(['post', postId], (old: PostDetail | undefined) => {
        if (!old) return old;
        return {
          ...old,
          isLiked: Boolean(data.liked),
          likeCount: typeof data.likeCount === 'number' ? data.likeCount : old.likeCount,
        };
      });
    },
    onSettled: () => {
      // 목록은 필요 시 동기화(상세는 refetch 금지)
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

// ==================== 댓글 API ====================

// 댓글 목록 조회
export const useCommentsQuery = (postId: number) => {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { accessToken: token } = useLoginStore.getState();
      const response = await fetch(`${API_BASE_URL}/api/v1/posts/${postId}/comments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('댓글 조회 실패');
      const result: CustomResponse<Comment[]> = await response.json();
      return result.data;
    },
  });
};

// 댓글 작성
export const useCreateCommentMutation = (postId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CommentCreateRequest) => {
      const { accessToken: token } = useLoginStore.getState();
      const response = await fetch(`${API_BASE_URL}/api/v1/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('댓글 작성 실패');
      const result: CustomResponse<Comment> = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });
};

// 댓글 수정
export const useUpdateCommentMutation = (postId: number, commentId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CommentUpdateRequest) => {
      const { accessToken: token } = useLoginStore.getState();
      const response = await fetch(
        `${API_BASE_URL}/api/v1/posts/${postId}/comments/${commentId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) throw new Error('댓글 수정 실패');
      const result: CustomResponse<Comment> = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });
};

// 댓글 삭제
export const useDeleteCommentMutation = (postId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: number) => {
      const { accessToken: token } = useLoginStore.getState();
      const response = await fetch(
        `${API_BASE_URL}/api/v1/posts/${postId}/comments/${commentId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error('댓글 삭제 실패');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });
};

// 댓글 좋아요
export const useToggleCommentLikeMutation = (postId: number, commentId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (isLiked: boolean) => {
      const { accessToken: token } = useLoginStore.getState();
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(
        `${API_BASE_URL}/api/v1/posts/${postId}/comments/${commentId}/likes`,
        {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error('좋아요 처리 실패');
      const result: CustomResponse<LikeStatus> = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });
};
