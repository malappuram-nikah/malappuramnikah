"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Eye,
  MessageCircle,
  Star,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Lock,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getEnrichedProfile } from "@/lib/profile-utils";
import ProfileCompletionTracker from "@/components/dashboard/ProfileCompletionTracker";
import BiodataDownload from "@/components/dashboard/BiodataDownload";
import { useUser } from "@/context/UserContext";
import ProfileSlideOver from "@/components/dashboard/ProfileSlideOver";
import { useProfileActions } from "@/hooks/useProfileActions";
import { API_URL } from "../../lib/config";
import { toast } from "sonner";

// New UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { currentUser } = useUser();
  const [mounted, setMounted] = useState(false);
  const { toggleFavourite, isFavourite } = useProfileActions();

  // Real Statistics state
  const [stats, setStats] = useState([
    {
      label: "Interests Sent",
      value: "—",
      icon: Heart,
      color: "bg-rose-50 text-rose-600",
    },
    {
      label: "Accepted Interests",
      value: "—",
      icon: Star,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Requests Received",
      value: "—",
      icon: MessageCircle,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Profile Views",
      value: "—",
      icon: Eye,
      color: "bg-brand-50 text-brand-600",
    },
  ]);

  const [suggestedMatches, setSuggestedMatches] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  useEffect(() => {
    if (selectedProfile) {
      setActivePhoto(selectedProfile.img);
    } else {
      setActivePhoto(null);
    }
  }, [selectedProfile]);

  const [interests, setInterests] = useState<{
    sent: number[];
    received: number[];
    mutual: number[];
  }>({
    sent: [],
    received: [],
    mutual: [],
  });

  const fetchInterests = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/user/interest?idsOnly=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const sentIds = data.sent.map((u: any) => u.id);
        const receivedIds = data.received.map((u: any) => u.id);
        const mutualIds = data.mutual.map((u: any) => u.id);

        setInterests({
          sent: sentIds,
          received: receivedIds,
          mutual: mutualIds,
        });

        setStats([
          {
            label: "Interests Sent",
            value: String(sentIds.length),
            icon: Heart,
            color: "bg-rose-50 text-rose-600",
          },
          {
            label: "Accepted Interests",
            value: String(mutualIds.length),
            icon: Star,
            color: "bg-amber-50 text-amber-600",
          },
          {
            label: "Requests Received",
            value: String(receivedIds.length),
            icon: MessageCircle,
            color: "bg-blue-50 text-blue-600",
          },
          {
            label: "Profile Views",
            value: "N/A",
            icon: Eye,
            color: "bg-gray-100 text-gray-400",
          },
        ]);
      }
    } catch (e) {
      console.error("Failed to fetch dashboard stats:", e);
    }
  };

  const fetchProfilesAndSuggestions = async () => {
    try {
      const storedToken = localStorage.getItem("mn_token");
      if (storedToken) {
        await fetchInterests(storedToken);
      }

      const res = await fetch(`${API_URL}/user/profiles`, {
        headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : {},
      });
      const data = await res.json();

      if (data.success && data.users) {
        const tokenPayload = storedToken
          ? JSON.parse(atob(storedToken.split(".")[1]))
          : {};
        const loggedInId = tokenPayload.userId || null;

        const otherUsers = data.users.filter((u: any) => u.id !== loggedInId);

        const mapped = otherUsers.map((u: any, i: number) => {
          const enriched = getEnrichedProfile(u);
          return {
            ...enriched,
            id: u.id,
            name: `${u.first_name || ""} ${u.last_name || ""}`.trim(),
            img: enriched.photo,
            caste: enriched.community,
            match: 82 + (i % 15),
            matchScore: 82 + (i % 15),
            photos: u.profile_details?.mn_profile_photos_draft?.photos || [],
            video:
              u.profile_details?.mn_video_intro_draft?.video?.dataUrl || null,
            voice:
              u.profile_details?.mn_voice_intro_draft?.voice?.dataUrl || null,
            aboutMe: enriched.aboutMe || enriched.personalityDescription,
            aiExplanation:
              u.profile_details?.mn_partner_preferences_draft?.explanation ||
              "Highly compatible profile based on your preferences.",
            conversationStarter:
              "I would love to learn more about your values and partner goals!",
            profile_details: u.profile_details,
            kyc_status: u.kyc_status,
            is_online: u.is_online,
            is_new_user: u.is_new_user,
            created_at: u.created_at,
            last_login: u.last_login,
          };
        });

        setSuggestedMatches(mapped.slice(0, 4));
      }
    } catch (err) {
      console.error("Dashboard suggestions loading failed:", err);
      toast.error("Failed to load suggested matches.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchProfilesAndSuggestions();
  }, []);

  const handleToggleInterest = async (
    receiverId: number,
    profileName: string,
  ) => {
    try {
      const storedToken = localStorage.getItem("mn_token");
      if (!storedToken) {
        toast.error("Please log in to express interest.");
        return;
      }

      const res = await fetch(`${API_URL}/user/interest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`,
        },
        body: JSON.stringify({ receiver_id: receiverId }),
      });

      const data = await res.json();
      if (data.success) {
        await fetchInterests(storedToken);
        if (data.status === "ACCEPTED") {
          toast.success(
            `Interest accepted with ${profileName}! 🎉 Chat unlocked.`,
          );
        } else if (data.status === "PENDING") {
          toast.success(`Interest request sent to ${profileName}!`);
        } else {
          toast.info(`Withdrew interest for ${profileName}.`);
        }
      } else {
        toast.error(data.message || "Failed to update interest status.");
      }
    } catch (e) {
      console.error("Interest toggle failed:", e);
      toast.error("An error occurred while updating interest.");
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-12 relative max-w-7xl mx-auto px-4 sm:px-6">
      {/* Premium Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-50 via-white to-brand-50 p-8 sm:p-10 border border-brand-100 shadow-sm"
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 font-playfair tracking-tight mb-3">
              Welcome back,{" "}
              <span className="text-brand-600">
                {currentUser?.first_name || "Guest"}
              </span>
              !
            </h1>
            <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
              Discover highly compatible matches and review your incoming
              interests. Your perfect partner might just be a click away.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              asChild
              variant="outline"
              className="rounded-full shadow-sm"
            >
              <Link href="/dashboard/interests">
                <Heart className="w-4 h-4 mr-2 text-pink-500 fill-pink-500" />
                View Interests
              </Link>
            </Button>
            <Button asChild className="rounded-full shadow-md">
              <Link href="/dashboard/matches">
                AI Matches <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            {currentUser && (
              <BiodataDownload
                profile={currentUser}
                enriched={getEnrichedProfile(currentUser)}
              />
            )}
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60" />
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-gray-100 shadow-sm hover:shadow-md hover:border-brand-100 transition-all duration-300">
              <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                    stat.color,
                  )}
                >
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-sm font-semibold text-gray-500 mt-1 uppercase tracking-wide">
                    {stat.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Suggested Matches */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 font-playfair tracking-tight">
            <Sparkles className="w-6 h-6 text-brand-600" /> Recommended For You
          </h2>
          <Button
            asChild
            variant="ghost"
            className="text-brand-600 hover:text-brand-700 hover:bg-brand-50"
          >
            <Link href="/dashboard/search">
              Browse all <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="overflow-hidden border-gray-100">
                <Skeleton className="h-64 w-full rounded-none" />
                <CardContent className="p-4 space-y-3">
                  <div className="flex gap-2">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 flex-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : suggestedMatches.length === 0 ? (
          <Card className="bg-gray-50 border-dashed border-2 border-gray-200">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Sparkles className="w-8 h-8 text-brand-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No recommendations yet
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                Complete your profile preferences to help our AI find the
                perfect matches for you.
              </p>
              <Button asChild className="mt-6">
                <Link href="/profile-setup">Complete Profile</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {suggestedMatches.map((match, i) => {
              const isMutual = interests.mutual.includes(match.id);
              const isSent = interests.sent.includes(match.id);
              const isReceived = interests.received.includes(match.id);
              const isInterested = isMutual || isSent || isReceived;

              let interestText = "Interest";
              let isHeartFilled = false;

              if (isMutual) {
                interestText = "Matched! 🎉";
                isHeartFilled = true;
              } else if (isSent) {
                interestText = "Sent";
                isHeartFilled = true;
              } else if (isReceived) {
                interestText = "Accept";
              }

              const isOnline = match.is_online;
              const isNew =
                match.is_new_user ||
                (match.created_at
                  ? Math.abs(
                      new Date().getTime() -
                        new Date(match.created_at).getTime(),
                    ) /
                      (1000 * 60 * 60 * 24) <=
                    7
                  : false);
              const isRecentlyActive = match.last_login
                ? Math.abs(
                    new Date().getTime() - new Date(match.last_login).getTime(),
                  ) /
                    (1000 * 60 * 60) <=
                  24
                : false;

              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                >
                  <Card className="overflow-hidden border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 group flex flex-col h-full bg-white rounded-2xl">
                    <div
                      onClick={() => setSelectedProfile(match)}
                      className="relative h-72 overflow-hidden bg-gray-100 cursor-pointer"
                    >
                      {match.img ? (
                        <img
                          src={match.img}
                          alt={match.name}
                          className={cn(
                            "w-full h-full object-cover transition-transform duration-700 group-hover:scale-105",
                            !isInterested && "filter blur-[16px] scale-110",
                          )}
                        />
                      ) : (
                        <div className="w-full h-full bg-brand-50 flex items-center justify-center text-brand-300 font-extrabold text-5xl uppercase">
                          {match.name.charAt(0)}
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent pointer-events-none" />

                      {!isInterested && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-all">
                          <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/30 flex items-center gap-2">
                            <Lock className="w-4 h-4 text-brand-600" />
                            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                              Connect to view photo
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                        {isOnline && (
                          <Badge
                            variant="secondary"
                            className="bg-green-500 text-white hover:bg-green-600 border-0 shadow-sm gap-1.5 px-2.5 py-1 text-[10px]"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            Online
                          </Badge>
                        )}
                        {isNew ? (
                          <Badge className="bg-brand-500 hover:bg-brand-600 text-white border-0 shadow-sm px-2.5 py-1 text-[10px]">
                            New Member
                          </Badge>
                        ) : isRecentlyActive ? (
                          <Badge
                            variant="secondary"
                            className="bg-blue-500 text-white hover:bg-blue-600 border-0 shadow-sm px-2.5 py-1 text-[10px]"
                          >
                            Recently Active
                          </Badge>
                        ) : null}
                      </div>

                      <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-3">
                        <Badge
                          variant="secondary"
                          className="bg-black/50 hover:bg-black/70 text-white backdrop-blur-md border border-white/10 gap-1.5 px-2.5 py-1"
                        >
                          <TrendingUp className="w-3.5 h-3.5 text-brand-400" />
                          {match.match}% Match
                        </Badge>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavourite(match.id).then((r) =>
                              toast.success(
                                r === "FAVOURITED"
                                  ? "Added to favourites!"
                                  : "Removed from favourites",
                              ),
                            );
                          }}
                          className={cn(
                            "p-2.5 rounded-full backdrop-blur-md transition-all shadow-lg",
                            isFavourite(match.id)
                              ? "bg-amber-400 text-white scale-110"
                              : "bg-black/40 text-white hover:text-amber-400 hover:bg-black/60",
                          )}
                        >
                          <Star
                            className={cn(
                              "w-4 h-4",
                              isFavourite(match.id) && "fill-white",
                            )}
                          />
                        </button>
                      </div>

                      {/* Profile Text Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-5 z-10 text-white">
                        <h3 className="font-bold text-xl flex items-center gap-2 leading-tight">
                          {match.name}
                          {match.kyc_status === "VERIFIED" && (
                            <span title="Verified Profile">
                              <ShieldCheck className="w-5 h-5 text-blue-400" />
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-200">
                          <span>{match.age} yrs</span>
                          <span className="w-1 h-1 rounded-full bg-gray-400" />
                          <span className="truncate">{match.location}</span>
                        </div>
                        <p className="text-sm text-brand-300 font-semibold mt-1 truncate">
                          {match.caste}
                        </p>
                      </div>
                    </div>

                    <CardContent className="p-5 bg-white flex flex-col gap-3 flex-1 justify-end">
                      <div className="flex gap-3 w-full">
                        <Button
                          variant={
                            isMutual
                              ? "default"
                              : isSent
                                ? "secondary"
                                : "outline"
                          }
                          onClick={() =>
                            handleToggleInterest(match.id, match.name)
                          }
                          className={cn(
                            "flex-1 text-xs sm:text-sm font-semibold h-11",
                            isMutual &&
                              "bg-pink-600 hover:bg-pink-700 text-white",
                            isSent &&
                              "bg-pink-50 text-pink-700 hover:bg-pink-100 border-pink-100",
                            isReceived &&
                              "border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100 shadow-sm",
                          )}
                        >
                          <Heart
                            className={cn(
                              "w-4 h-4 mr-2",
                              isHeartFilled && "fill-current",
                            )}
                          />
                          {interestText}
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={!isMutual}
                          onClick={() => {
                            if (isMutual) {
                              router.push("/dashboard/chat");
                            } else {
                              toast.error(
                                "Chat is locked! Establish a mutual match first.",
                              );
                            }
                          }}
                          className={cn(
                            "flex-1 text-xs sm:text-sm font-semibold h-11",
                            isMutual
                              ? "bg-brand-600 text-white hover:bg-brand-700 shadow-sm"
                              : "bg-gray-100 text-gray-400",
                          )}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" /> Chat
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <ProfileCompletionTracker />

      <AnimatePresence>
        {selectedProfile && (
          <ProfileSlideOver
            profile={selectedProfile}
            onClose={() => setSelectedProfile(null)}
            interests={interests}
            onToggleInterest={handleToggleInterest}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
