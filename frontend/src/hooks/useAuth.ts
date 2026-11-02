
import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import {
    getCurrentUser,
    loginUser,
    logoutUser,
    registerUser,
    type LoginPayload,
    type RegisterPayload,
} from "../services/authService";

export const AUTH_QUERY_KEY = ["auth", "me"];

export function useAuth() {
    const queryClient = useQueryClient();

    const userQuery = useQuery({
        queryKey: AUTH_QUERY_KEY,
        queryFn: getCurrentUser,
        retry: false,
        staleTime: 60_000,
    });

    const loginMutation = useMutation({
        mutationFn: (payload: LoginPayload) => loginUser(payload),
        onSuccess: (user) => {
            queryClient.setQueryData(AUTH_QUERY_KEY, user);
        },
    });

    const registerMutation = useMutation({
        mutationFn: (payload: RegisterPayload) => registerUser(payload),
        onSuccess: (user) => {
            queryClient.setQueryData(AUTH_QUERY_KEY, user);
        },
    });

    const logoutMutation = useMutation({
        mutationFn: logoutUser,
        onSuccess: () => {
            queryClient.setQueryData(AUTH_QUERY_KEY, null);
            queryClient.removeQueries({ queryKey: ["favourites"] });
        },
    });

    return {
        user: userQuery.data ?? null,
        isLoading: userQuery.isLoading,
        isAuthenticated: Boolean(userQuery.data),
        loginMutation,
        registerMutation,
        logoutMutation,
    };
}
