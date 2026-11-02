
import { api } from "./authService";

export interface FavouriteStock {
    symbol: string;
    name: string;
    exchange?: string;
    addedAt: string;
}

interface FavouritesResponse {
    favourites: FavouriteStock[];
}

export async function getFavourites(): Promise<FavouriteStock[]> {
    const { data } = await api.get<FavouritesResponse>("/favourites");
    return data.favourites;
}

export async function addFavourite(
    stock: Pick<FavouriteStock, "symbol" | "name" | "exchange">,
): Promise<FavouriteStock[]> {
    const { data } = await api.post<FavouritesResponse>(
        "/favourites",
        stock,
    );
    return data.favourites;
}

export async function removeFavourite(
    symbol: string,
): Promise<FavouriteStock[]> {
    const { data } = await api.delete<FavouritesResponse>(
        `/favourites/${encodeURIComponent(symbol)}`,
    );
    return data.favourites;
}
