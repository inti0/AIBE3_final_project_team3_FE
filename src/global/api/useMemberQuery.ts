import { useQuery } from "@tanstack/react-query";
import { useLoginStore } from "@/global/stores/useLoginStore";
import apiClient from "@/global/backend/client";
import { MemberSummaryResp } from "@/global/types/auth.types";

const fetchAllMembers = async (): Promise<MemberSummaryResp[]> => {
    const { data: apiResponse, error } = await apiClient.GET("/api/v1/find/members");

    if (error) {
        throw new Error(JSON.stringify(error));
    }
    
    // apiResponse는 ApiResponseWrapper<MemberSummaryResp[]> 타입이므로, 실제 데이터는 apiResponse.data에 있습니다.
    return apiResponse?.data || [];
};

export const useMembersQuery = () => {
    const { accessToken } = useLoginStore();

    return useQuery<MemberSummaryResp[], Error>({
        queryKey: ["members"],
        queryFn: fetchAllMembers,
        enabled: !!accessToken, // Only run the query if the user is logged in
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
    });
};
