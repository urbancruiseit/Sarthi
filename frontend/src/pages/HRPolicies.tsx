import { useEffect, useState, useRef } from "react";
import {
  FileText,
  Eye,
  Search,
  BookOpen,
  Shield,
  Users,
  Briefcase,
  X,
  ChevronUp,
  ChevronDown,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import {
  fetchPolicies,
  updateHrPolicyStatus,
  updateShoPolicyStatus,
} from "@/redux/features/policy/policySlice";

import * as pdfjsLib from "pdfjs-dist";
import { Policy } from "@/types";
// Vite-friendly worker setup
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url,
).href;

const CATEGORY_ICONS: Record<string, any> = {
  HR: Users,
  Compliance: Shield,
  Finance: Briefcase,
  IT: BookOpen,
};

const STATUS_COLORS = {
  active: { bg: "hsl(var(--success) / 0.12)", color: "hsl(var(--success))" },
  pending: { bg: "hsl(var(--warning) / 0.12)", color: "hsl(var(--warning))" },
  inactive: { bg: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" },
};

const APPROVAL_STATUS_COLORS = {
  approved: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    icon: CheckCircle,
  },
  rejected: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    icon: XCircle,
  },
  pending: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-700 dark:text-yellow-400",
    icon: Loader2,
  },
};

export default function HRPolicies() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // PDF viewer state
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerTitle, setViewerTitle] = useState<string>("");
  const [currentPolicy, setCurrentPolicy] = useState<Policy | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [rejectModal, setRejectModal] = useState<{
    open: boolean;
    policyId: number | null;
    role: "HR" | "SHO" | null;
  }>({
    open: false,
    policyId: null,
    role: null,
  });

  const [remarkInput, setRemarkInput] = useState("");

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const { policies } = useAppSelector((state) => state.policy);
  const { currentEmployee } = useAppSelector((state) => state.user);

  console.log("currentEmployee", currentEmployee.access_role);

  const currentRole = currentEmployee?.role;
  const currentRoleaccess = currentEmployee?.access_role;
  const isHRHead = currentRole === "Admin";
  const isSHO = currentRole === "SHO";
  const isEmployee = currentRoleaccess === "EMPLOYEE";

  useEffect(() => {
    dispatch(fetchPolicies(categoryFilter));
  }, [dispatch, categoryFilter]);

  // Security: block print/screenshot/devtools ONLY when PDF viewer is open
  useEffect(() => {
    if (!viewerUrl) return;

    const handleKey = (e: KeyboardEvent) => {
      if (
        e.key === "PrintScreen" ||
        (e.ctrlKey && ["p", "s", "u"].includes(e.key.toLowerCase())) ||
        (e.ctrlKey &&
          e.shiftKey &&
          ["i", "j", "c"].includes(e.key.toLowerCase())) ||
        (e.metaKey && ["p", "s"].includes(e.key.toLowerCase())) ||
        e.key === "F12"
      ) {
        e.preventDefault();
      }
    };

    const disableRightClick = (e: MouseEvent) => e.preventDefault();
    const disableDrag = (e: DragEvent) => e.preventDefault();
    const disableSelect = (e: Event) => e.preventDefault();

    document.addEventListener("keydown", handleKey);
    document.addEventListener("contextmenu", disableRightClick);
    document.addEventListener("dragstart", disableDrag);
    document.addEventListener("selectstart", disableSelect);

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("contextmenu", disableRightClick);
      document.removeEventListener("dragstart", disableDrag);
      document.removeEventListener("selectstart", disableSelect);
    };
  }, [viewerUrl]);

  // Render ALL pages when a PDF URL is set
  useEffect(() => {
    if (!viewerUrl) return;

    setPages([]);
    setTotalPages(0);
    setCurrentPage(1);
    setLoadingProgress(0);
    setLoading(true);

    const renderAll = async () => {
      try {
        const pdfDoc = await pdfjsLib.getDocument(viewerUrl).promise;
        const numPages = pdfDoc.numPages;
        setTotalPages(numPages);

        const rendered: string[] = [];

        for (let i = 1; i <= numPages; i++) {
          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d")!;

          await page.render({ canvasContext: ctx, viewport }).promise;

          // Watermark
          ctx.save();
          ctx.font = "bold 36px Arial";
          ctx.fillStyle = "rgba(0, 0, 0, 0.10)";
          ctx.translate(viewport.width / 2, viewport.height / 2);
          ctx.rotate(-0.4);
          ctx.textAlign = "center";
          ctx.fillText("Confidential • HR Policy", 0, 0);
          ctx.restore();

          rendered.push(canvas.toDataURL("image/jpeg", 0.92));
          setLoadingProgress(Math.round((i / numPages) * 100));
        }

        setPages(rendered);
      } catch (err) {
        console.error("PDF render error:", err);
      } finally {
        setLoading(false);
      }
    };

    renderAll();
  }, [viewerUrl]);

  // Track current page based on scroll position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const center = scrollTop + containerHeight / 2;

      let closestPage = 1;
      let closestDist = Infinity;

      pageRefs.current.forEach((ref, idx) => {
        if (!ref) return;
        const midpoint = ref.offsetTop + ref.offsetHeight / 2;
        const dist = Math.abs(center - midpoint);
        if (dist < closestDist) {
          closestDist = dist;
          closestPage = idx + 1;
        }
      });

      setCurrentPage(closestPage);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [pages]);

  const scrollToPage = (pageNum: number) => {
    const ref = pageRefs.current[pageNum - 1];
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const closeViewer = () => {
    setViewerUrl(null);
    setViewerTitle("");
    setCurrentPolicy(null);
    setPages([]);
    setTotalPages(0);
    setCurrentPage(1);
  };

  const openViewer = (policy: Policy) => {
    setViewerTitle(policy.title);
    setViewerUrl(policy.fileUrl);
    setCurrentPolicy(policy);
  };

  const handleHRAction = async (
    policyId: number,
    action: "approved" | "rejected",
    remark?: string,
  ) => {
    if (action === "rejected" && !remark) {
      alert("Please provide a remark");
      return;
    }

    setActionLoading(policyId.toString());

    try {
      await dispatch(
        updateHrPolicyStatus({
          id: policyId,
          hr_head_status: action,
          hr_head_remark: remark || "",
        }),
      );

      dispatch(fetchPolicies(categoryFilter));
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSHOAction = async (
    policyId: number,
    action: "approved" | "rejected",
    remark?: string,
  ) => {
    if (action === "rejected" && !remark) {
      alert("Please provide a remark");
      return;
    }

    setActionLoading(policyId.toString());

    try {
      await dispatch(
        updateShoPolicyStatus({
          id: policyId,
          sho_status: action,
          sho_remark: remark || "",
        }),
      );

      dispatch(fetchPolicies(categoryFilter));
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const categories = [
    "all",
    ...Array.from(
      new Set(policies.filter((p) => p?.category).map((p) => p.category)),
    ),
  ];

  const filteredPolicies = policies.filter((p) => {
    if (!p || !p.title) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const getApprovalStatusBadge = (status: string | null) => {
    const statusKey = status || "pending";
    const config =
      APPROVAL_STATUS_COLORS[statusKey as keyof typeof APPROVAL_STATUS_COLORS];

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">HR Policies</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Company policies, guidelines and compliance documents
        </p>
      </div>

      {/* Stats */}
      {!isEmployee && (
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Active Policies",
              value: policies.filter((p) => p?.status === "active").length,
              color: "success",
            },
            {
              label: "Pending Policies",
              value: policies.filter((p) => p?.status === "pending").length,
              color: "warning",
            },
            {
              label: "Inactive",
              value: policies.filter((p) => p?.status === "inactive").length,
              color: "muted-foreground",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-xl border border-border bg-card p-4 text-center"
            >
              <p
                className="text-2xl font-bold"
                style={{ color: `hsl(var(--${color}))` }}
              >
                {value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search policies..."
            className="w-full pl-9 pr-4 h-9 rounded-lg border border-input bg-background text-sm"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-colors ${
                categoryFilter === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border bg-background hover:bg-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* EMPLOYEE CARD VIEW */}
      {isEmployee ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPolicies.map((policy) => {
            const Icon = CATEGORY_ICONS[policy.category] || FileText;

            return (
              <div
                key={policy.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-primary" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-2">
                      {policy.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">
                      {policy.category}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-3 mb-4 min-h-[48px]">
                  {policy.description || "No description available"}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Version</span>
                    <span className="font-medium text-foreground">
                      v{policy.version}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span className="font-medium text-foreground">
                      {new Date(policy.lastUpdated).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => openViewer(policy)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 transition-colors"
                >
                  <Eye size={16} />
                  View Policy
                </button>
              </div>
            );
          })}

          {filteredPolicies.length === 0 && (
            <div className="col-span-full text-center py-12 rounded-xl border border-border bg-card">
              <FileText
                size={48}
                className="mx-auto text-muted-foreground/50 mb-3"
              />
              <p className="text-muted-foreground">No policies found</p>
            </div>
          )}
        </div>
      ) : (
        /* OTHER ROLES TABLE VIEW (same as existing) */
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">
                    Title
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">
                    Category
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">
                    Description
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">
                    Version
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">
                    Last Updated
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">
                    Status
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">
                    HR Head Status
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">
                    HR Remark
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">
                    CEO Status
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">
                    CEO Remark
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPolicies.map((policy) => {
                  const Icon = CATEGORY_ICONS[policy.category] || FileText;
                  const sc =
                    STATUS_COLORS[policy.status] ?? STATUS_COLORS["pending"];

                  return (
                    <tr
                      key={policy.id}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: "hsl(var(--primary)/0.1)" }}
                          >
                            <Icon
                              size={14}
                              style={{ color: "hsl(var(--primary))" }}
                            />
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {policy.title}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-muted-foreground capitalize">
                          {policy.category}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="text-xs text-muted-foreground line-clamp-2 max-w-xs">
                          {policy.description}
                        </p>
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-muted-foreground">
                          v{policy.version}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-muted-foreground">
                          {new Date(policy.lastUpdated).toLocaleString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium capitalize"
                          style={{ background: sc.bg, color: sc.color }}
                        >
                          {policy.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {getApprovalStatusBadge(policy.hr_head_status)}
                      </td>

                      {/* HR Remark: only show when rejected */}
                      <td className="p-4">
                        {policy.hr_head_status === "rejected" &&
                        policy.hr_head_remark ? (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md max-w-[160px] break-words">
                            <XCircle size={11} className="shrink-0" />
                            {policy.hr_head_remark}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            -
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        {getApprovalStatusBadge(policy.sho_status)}
                      </td>

                      {/* SHO Remark: only show when rejected */}
                      <td className="p-4">
                        {policy.sho_status === "rejected" &&
                        policy.sho_remark ? (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md max-w-[160px] break-words">
                            <XCircle size={11} className="shrink-0" />
                            {policy.sho_remark}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            -
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openViewer(policy)}
                            className="p-1.5 rounded-sm bg-blue-600 hover:bg-blue-900 text-white transition-colors"
                            title="View PDF"
                          >
                            <Eye size={18} />
                          </button>

                          {/* HR Head Actions */}
                          {isHRHead && policy.hr_head_status === "pending" && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() =>
                                  handleHRAction(policy.id, "approved")
                                }
                                className="p-1.5 rounded-sm bg-green-500 hover:bg-green-900 text-white transition-colors disabled:opacity-50"
                                title="Approve as HR Head"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() =>
                                  setRejectModal({
                                    open: true,
                                    policyId: policy.id,
                                    role: "HR",
                                  })
                                }
                                className="p-1.5 rounded-sm bg-red-500 hover:bg-red-900 text-white transition-colors disabled:opacity-50"
                                title="Reject as HR Head"
                              >
                                <XCircle size={18} />
                              </button>
                            </div>
                          )}

                          {/* SHO Actions */}
                          {isSHO && policy.sho_status === "pending" && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() =>
                                  handleSHOAction(policy.id, "approved")
                                }
                                className="p-1.5 rounded-sm bg-green-500 hover:bg-green-900 text-white transition-colors disabled:opacity-50"
                                title="Approve as SHO"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() =>
                                  setRejectModal({
                                    open: true,
                                    policyId: policy.id,
                                    role: "SHO",
                                  })
                                }
                                className="p-1.5 rounded-sm bg-red-500 hover:bg-red-900 text-white transition-colors disabled:opacity-50"
                                title="Reject as SHO"
                              >
                                <XCircle size={18} />
                              </button>
                            </div>
                          )}

                          {actionLoading === policy.id.toString() && (
                            <Loader2
                              size={14}
                              className="animate-spin text-muted-foreground"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredPolicies.length === 0 && (
            <div className="text-center py-12">
              <FileText
                size={48}
                className="mx-auto text-muted-foreground/50 mb-3"
              />
              <p className="text-muted-foreground">No policies found</p>
            </div>
          )}
        </div>
      )}

      {/* PDF Viewer Modal */}
      {viewerUrl && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl h-[92vh] bg-white dark:bg-zinc-900 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <FileText
                  size={16}
                  className="text-muted-foreground shrink-0"
                />
                <span className="text-sm font-medium text-foreground truncate">
                  {viewerTitle}
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Page counter */}
                {totalPages > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <button
                      onClick={() => scrollToPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage <= 1}
                      className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <span className="font-mono min-w-[60px] text-center">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        scrollToPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage >= totalPages}
                      className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                )}

                <span className="hidden sm:inline-flex px-2 py-0.5 text-xs font-medium rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  Confidential
                </span>

                <button
                  onClick={closeViewer}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* PDF Content */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto bg-zinc-200 dark:bg-zinc-800 select-none"
            >
              {/* Loading state */}
              {loading && (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                  <Loader2 size={32} className="animate-spin" />
                  <div className="text-sm">
                    Loading PDF...{" "}
                    {loadingProgress > 0 && `${loadingProgress}%`}
                  </div>
                  {totalPages > 0 && (
                    <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300 rounded-full"
                        style={{ width: `${loadingProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Pages */}
              {!loading && pages.length > 0 && (
                <div className="flex flex-col items-center gap-4 py-6 px-4">
                  {pages.map((src, i) => (
                    <div
                      key={i}
                      ref={(el) => {
                        pageRefs.current[i] = el;
                      }}
                      className="relative w-full max-w-3xl"
                    >
                      <div className="absolute -top-5 left-0 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                        Page {i + 1}
                      </div>

                      <img
                        src={src}
                        alt={`Page ${i + 1}`}
                        className="w-full rounded shadow-lg block pointer-events-none"
                        draggable={false}
                      />
                    </div>
                  ))}

                  <div className="text-xs text-zinc-400 dark:text-zinc-600 pb-2">
                    — End of document ({totalPages} page
                    {totalPages !== 1 ? "s" : ""}) —
                  </div>
                </div>
              )}

              {/* Error / empty */}
              {!loading && pages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground text-sm">
                  <FileText size={32} className="opacity-40" />
                  <p>Unable to load PDF.</p>
                </div>
              )}
            </div>

            {/* Footer progress bar (while loading) */}
            {loading && totalPages > 0 && (
              <div className="h-1 bg-muted shrink-0">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-xl w-full max-w-md p-5 shadow-xl">
            <h2 className="text-lg font-semibold mb-3">
              Reject Policy ({rejectModal.role})
            </h2>

            <textarea
              value={remarkInput}
              onChange={(e) => setRemarkInput(e.target.value)}
              placeholder="Enter rejection remark..."
              className="w-full h-24 p-2 border rounded-md text-sm"
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setRejectModal({ open: false, policyId: null, role: null });
                  setRemarkInput("");
                }}
                className="px-3 py-1.5 text-sm rounded bg-muted"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  if (!remarkInput.trim()) {
                    alert("Remark is required");
                    return;
                  }

                  if (rejectModal.role === "HR") {
                    handleHRAction(
                      rejectModal.policyId!,
                      "rejected",
                      remarkInput,
                    );
                  } else {
                    handleSHOAction(
                      rejectModal.policyId!,
                      "rejected",
                      remarkInput,
                    );
                  }

                  setRejectModal({ open: false, policyId: null, role: null });
                  setRemarkInput("");
                }}
                className="px-3 py-1.5 text-sm rounded bg-red-600 text-white"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
