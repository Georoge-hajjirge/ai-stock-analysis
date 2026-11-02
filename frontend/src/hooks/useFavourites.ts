
import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import {
    addFavourite,
    getFavourites,
    removeFavourite,
    type FavouriteStock,
} from "../services/favouritesService";

export const FAVOURITES_QUERY_KEY = ["favourites"];

export function useFavourites() {
    const queryClient = useQueryClient();

    const favouritesQuery = useQuery({
        queryKey: FAVOURITES_QUERY_KEY,
        queryFn: getFavourites,
        retry: false,
    });

    const addMutation = useMutation({
        mutationFn: addFavourite,
        onSuccess: (favourites) => {
            queryClient.setQueryData(FAVOURITES_QUERY_KEY, favourites);
        },
    });

    const removeMutation = useMutation({
        mutationFn: removeFavourite,
        onSuccess: (favourites) => {
            queryClient.setQueryData(FAVOURITES_QUERY_KEY, favourites);
        },
    });

    const isFavourite = (symbol: string) =>
        (favouritesQuery.data ?? []).some(
            (item) => item.symbol === symbol.toUpperCase(),
        );

    return {
        favourites: (favouritesQuery.data ?? []) as FavouriteStock[],
        isLoading: favouritesQuery.isLoading,
        error: favouritesQuery.error,
        isFavourite,
        addFavourite: addMutation.mutateAsync,
        removeFavourite: removeMutation.mutateAsync,
        isAdding: addMutation.isPending,
        isRemoving: removeMutation.isPending,
    };
}
