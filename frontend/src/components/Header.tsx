
import type { ReactNode } from "react";
import {
    ArrowLeft,
    ArrowRightLeft,
    LogIn,
    LogOut,
    Star,
    TrendingUp,
    UserPlus,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface HeaderProps {
    showBack?: boolean;
    backLabel?: string;
    backTo?: string;
    actions?: ReactNode;
}

function Header({
    showBack = false,
    backLabel = "Dashboard",
    backTo = "/",
    actions,
}: HeaderProps) {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const onCompare = pathname.startsWith("/compare");
    const onWatchlist = pathname.startsWith("/watchlist");

    const {
        user,
        isLoading,
        logoutMutation,
    } = useAuth();

    const handleLogout = async () => {
        try {
            await logoutMutation.mutateAsync();
            navigate("/", { replace: true });
        } catch {
            // Keep the current session if logout fails.
        }
    };

    return (
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4 lg:px-8">
                <div className="flex items-center gap-2">
                    {showBack && (
                        <button
                            onClick={() => navigate(backTo)}
                            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                        >
                            <ArrowLeft size={17} />
                            <span className="hidden sm:inline">
                                {backLabel}
                            </span>
                        </button>
                    )}

                    <button
                        onClick={() => navigate("/")}
                        className="flex items-center gap-3 text-left"
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm">
                            <TrendingUp size={20} />
                        </div>

                        <div className="hidden sm:block">
                            <p className="text-base font-bold tracking-tight text-slate-950">
                                AI Stock Intelligence
                            </p>
                            <p className="text-xs text-slate-500">
                                Indian market insights
                            </p>
                        </div>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {actions}

                    <button
                        onClick={() => navigate("/compare")}
                        aria-current={onCompare ? "page" : undefined}
                        className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-white transition sm:px-4 sm:text-sm ${onCompare
                                ? "bg-blue-700 ring-2 ring-blue-200"
                                : "bg-blue-600 hover:bg-blue-700"
                            }`}
                    >
                        <ArrowRightLeft size={16} />
                        <span className="hidden sm:inline">
                            Compare Stocks
                        </span>
                        <span className="sm:hidden">Compare</span>
                    </button>

                    <button
                        onClick={() =>
                            navigate(
                                user
                                    ? "/watchlist"
                                    : "/login?redirect=%2Fwatchlist"
                            )
                        }
                        aria-current={onWatchlist ? "page" : undefined}
                        className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-white transition sm:px-4 sm:text-sm ${onWatchlist
                                ? "bg-amber-600 ring-2 ring-amber-200"
                                : "bg-amber-500 hover:bg-amber-600"
                            }`}
                    >
                        <Star size={16} />
                        <span className="hidden sm:inline">Watchlist</span>
                    </button>

                    {!isLoading && user ? (
                        <>
                            <span
                                className="hidden max-w-32 truncate text-sm font-medium text-slate-700 lg:inline"
                                title={`${user.firstName} ${user.lastName}`}
                            >
                                {user.firstName}
                            </span>

                            <button
                                onClick={() => void handleLogout()}
                                disabled={logoutMutation.isPending}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 sm:text-sm"
                            >
                                <LogOut size={16} />
                                <span className="hidden sm:inline">
                                    {logoutMutation.isPending
                                        ? "Logging out..."
                                        : "Logout"}
                                </span>
                            </button>
                        </>
                    ) : !isLoading ? (
                        <>
                            <button
                                onClick={() => navigate("/login")}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 sm:text-sm"
                            >
                                <LogIn size={16} />
                                <span className="hidden sm:inline">
                                    Login
                                </span>
                            </button>

                            <button
                                onClick={() => navigate("/register")}
                                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 sm:text-sm"
                            >
                                <UserPlus size={16} />
                                <span className="hidden sm:inline">
                                    Register
                                </span>
                            </button>
                        </>
                    ) : null}
                </div>
            </div>
        </header>
    );
}

export default Header;
