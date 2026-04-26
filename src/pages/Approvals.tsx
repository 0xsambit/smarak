import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import {
	ClipboardCheck,
	Plus,
	Search,
	SquarePen,
	CheckCircle2,
	XCircle,
	Trash2,
	RotateCcw,
} from "lucide-react";
import {
	approvalsAPI,
	conservationAPI,
	incidentsAPI,
	sitesAPI,
	usersAPI,
} from "../services/api";

type UserRole = "NATIONAL_ADMIN" | "STATE_ADMIN" | "SITE_OFFICER";
type ApprovalType = "CONSERVATION" | "INCIDENT" | "REPORT" | "BUDGET";
type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

interface SiteSummary {
	_id: string;
	name: string;
	state: string;
	district: string;
}

interface IncidentSummary {
	_id: string;
	type: string;
	siteId: string | SiteSummary;
}

interface ConservationSummary {
	_id: string;
	title: string;
	siteId: string | SiteSummary;
}

interface ApprovalRecord {
	_id: string;
	type: ApprovalType;
	title: string;
	description?: string;
	referenceId: string;
	status: ApprovalStatus;
	isPriority: boolean;
	reviewNotes?: string;
	submittedBy?:
		| {
				_id?: string;
				name?: string;
				email?: string;
		  }
		| string;
	reviewedBy?: {
		_id?: string;
		name?: string;
		email?: string;
	};
	createdAt: string;
}

interface ApprovalFormValues {
	type: ApprovalType;
	title: string;
	description: string;
	referenceId: string;
	isPriority: boolean;
}

interface ReferenceOption {
	value: string;
	label: string;
}

const PAGE_SIZE = 10;
const TYPE_OPTIONS: ApprovalType[] = ["CONSERVATION", "INCIDENT", "REPORT", "BUDGET"];
const STATUS_OPTIONS: ApprovalStatus[] = ["PENDING", "APPROVED", "REJECTED"];

const EMPTY_FORM: ApprovalFormValues = {
	type: "INCIDENT",
	title: "",
	description: "",
	referenceId: "",
	isPriority: false,
};

const toSiteLabel = (value: string | SiteSummary, allSites: SiteSummary[]): string => {
	if (typeof value !== "string") {
		return `${value.name} (${value.state})`;
	}

	const site = allSites.find((candidate) => candidate._id === value);
	if (!site) {
		return "Unknown Site";
	}

	return `${site.name} (${site.state})`;
};

const submittedById = (approval: ApprovalRecord): string => {
	if (!approval.submittedBy) {
		return "";
	}

	if (typeof approval.submittedBy === "string") {
		return approval.submittedBy;
	}

	return approval.submittedBy._id || "";
};

const submittedByName = (approval: ApprovalRecord): string => {
	if (!approval.submittedBy) {
		return "Unknown";
	}

	if (typeof approval.submittedBy === "string") {
		return "Unknown";
	}

	return approval.submittedBy.name || approval.submittedBy.email || "Unknown";
};

const toPayload = (values: ApprovalFormValues) => ({
	type: values.type,
	title: values.title.trim(),
	...(values.description.trim() ? { description: values.description.trim() } : {}),
	referenceId: values.referenceId,
	isPriority: values.isPriority,
});

const toFormValues = (approval: ApprovalRecord): ApprovalFormValues => ({
	type: approval.type,
	title: approval.title,
	description: approval.description || "",
	referenceId: approval.referenceId,
	isPriority: approval.isPriority,
});

const Approvals: React.FC = () => {
	const { isLoaded } = useAuth();

	const [role, setRole] = useState<UserRole | null>(null);
	const [currentUserId, setCurrentUserId] = useState("");
	const [sites, setSites] = useState<SiteSummary[]>([]);
	const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
	const [projects, setProjects] = useState<ConservationSummary[]>([]);

	const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [search, setSearch] = useState("");
	const [selectedStatus, setSelectedStatus] = useState<ApprovalStatus | "">("");
	const [selectedType, setSelectedType] = useState<ApprovalType | "">("");
	const [showArchived, setShowArchived] = useState(false);

	const [showForm, setShowForm] = useState(false);
	const [editingApproval, setEditingApproval] = useState<ApprovalRecord | null>(null);
	const [formValues, setFormValues] = useState<ApprovalFormValues>(EMPTY_FORM);
	const [formError, setFormError] = useState<string | null>(null);

	const canReview = role === "NATIONAL_ADMIN" || role === "STATE_ADMIN";
	const canArchive = role === "NATIONAL_ADMIN";

	const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

	const referenceOptions = useMemo((): ReferenceOption[] => {
		if (formValues.type === "INCIDENT") {
			return incidents.map((incident) => ({
				value: incident._id,
				label: `${incident.type} • ${toSiteLabel(incident.siteId, sites)}`,
			}));
		}

		if (formValues.type === "CONSERVATION") {
			return projects.map((project) => ({
				value: project._id,
				label: `${project.title} • ${toSiteLabel(project.siteId, sites)}`,
			}));
		}

		return sites.map((site) => ({
			value: site._id,
			label: `${site.name} (${site.state})`,
		}));
	}, [formValues.type, incidents, projects, sites]);

	const filteredApprovals = useMemo(() => {
		if (!search.trim()) {
			return approvals;
		}

		const needle = search.trim().toLowerCase();
		return approvals.filter((approval) => {
			const combined =
				`${approval.title} ${approval.description || ""} ${approval.type}`.toLowerCase();
			return combined.includes(needle);
		});
	}, [approvals, search]);

	const resolveReferenceLabel = useCallback(
		(approval: ApprovalRecord) => {
			if (approval.type === "INCIDENT") {
				const incident = incidents.find(
					(candidate) => candidate._id === approval.referenceId,
				);
				if (!incident) {
					return "Incident";
				}
				return `${incident.type} • ${toSiteLabel(incident.siteId, sites)}`;
			}

			if (approval.type === "CONSERVATION") {
				const project = projects.find(
					(candidate) => candidate._id === approval.referenceId,
				);
				if (!project) {
					return "Conservation";
				}
				return `${project.title} • ${toSiteLabel(project.siteId, sites)}`;
			}

			const site = sites.find((candidate) => candidate._id === approval.referenceId);
			return site ? `${site.name} (${site.state})` : "Site";
		},
		[incidents, projects, sites],
	);

	const canEditApproval = useCallback(
		(approval: ApprovalRecord) => {
			if (approval.status !== "PENDING") {
				return false;
			}

			if (canReview) {
				return true;
			}

			return submittedById(approval) === currentUserId;
		},
		[canReview, currentUserId],
	);

	const initializeContext = useCallback(async () => {
		if (!isLoaded) {
			return;
		}

		try {
			const [meResponse, sitesResponse, incidentsResponse, projectsResponse] =
				await Promise.all([
					usersAPI.getMe(),
					sitesAPI.getAll({ limit: 1000 }),
					incidentsAPI.getAll({ limit: 500 }),
					conservationAPI.getAll({ limit: 500 }),
				]);

			setRole((meResponse.data?.role || null) as UserRole | null);
			setCurrentUserId(
				((meResponse.data?._id || meResponse.data?.id || "") as string).trim(),
			);
			setSites((sitesResponse.data?.sites || []) as SiteSummary[]);
			setIncidents((incidentsResponse.data?.incidents || []) as IncidentSummary[]);
			setProjects((projectsResponse.data?.projects || []) as ConservationSummary[]);
		} catch (contextError: any) {
			setError(
				contextError?.response?.data?.message ||
					"Failed to initialize approval context.",
			);
		}
	}, [isLoaded]);

	const fetchApprovals = useCallback(async () => {
		if (!isLoaded) {
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const { data } = await approvalsAPI.getAll({
				page,
				limit: PAGE_SIZE,
				...(selectedStatus ? { status: selectedStatus } : {}),
				...(selectedType ? { type: selectedType } : {}),
				...(showArchived ? { archived: true } : {}),
			});

			setApprovals((data?.approvals || []) as ApprovalRecord[]);
			setTotal(data?.total || 0);
		} catch (approvalError: any) {
			setError(approvalError?.response?.data?.message || "Failed to load approvals.");
		} finally {
			setLoading(false);
		}
	}, [isLoaded, page, selectedStatus, selectedType, showArchived]);

	useEffect(() => {
		initializeContext();
	}, [initializeContext]);

	useEffect(() => {
		fetchApprovals();
	}, [fetchApprovals]);

	useEffect(() => {
		if (referenceOptions.length === 0) {
			setFormValues((current) => ({ ...current, referenceId: "" }));
			return;
		}

		setFormValues((current) => {
			if (referenceOptions.some((option) => option.value === current.referenceId)) {
				return current;
			}

			return {
				...current,
				referenceId: referenceOptions[0].value,
			};
		});
	}, [referenceOptions]);

	const openCreate = () => {
		setEditingApproval(null);
		setFormValues({
			...EMPTY_FORM,
			referenceId: referenceOptions[0]?.value || "",
		});
		setFormError(null);
		setShowForm(true);
	};

	const openEdit = (approval: ApprovalRecord) => {
		if (!canEditApproval(approval)) {
			setError("You do not have permission to edit this approval.");
			return;
		}

		setEditingApproval(approval);
		setFormValues(toFormValues(approval));
		setFormError(null);
		setShowForm(true);
	};

	const resetFormState = () => {
		setShowForm(false);
		setEditingApproval(null);
		setFormValues(EMPTY_FORM);
		setFormError(null);
	};

	const closeForm = () => {
		if (submitting) {
			return;
		}

		resetFormState();
	};

	const handleArchive = async (approval: ApprovalRecord) => {
		if (!canArchive) {
			setError("Only national admins can archive approvals.");
			return;
		}

		const shouldArchive = window.confirm("Archive this approval request?");
		if (!shouldArchive) {
			return;
		}

		try {
			await approvalsAPI.remove(approval._id);
			await fetchApprovals();
		} catch (archiveError: any) {
			setError(archiveError?.response?.data?.message || "Failed to archive approval.");
		}
	};

	const handleRestore = async (approval: ApprovalRecord) => {
		if (!canArchive) {
			setError("Only national admins can restore approvals.");
			return;
		}

		try {
			await approvalsAPI.restore(approval._id);
			await fetchApprovals();
		} catch (restoreError: any) {
			setError(restoreError?.response?.data?.message || "Failed to restore approval.");
		}
	};

	const handleReview = async (approval: ApprovalRecord, status: "APPROVED" | "REJECTED") => {
		if (!canReview) {
			setError("Only admins can review approval requests.");
			return;
		}

		const reviewNotes =
			window.prompt(`Add optional notes for ${status.toLowerCase()}:`, "") || "";

		try {
			await approvalsAPI.review(approval._id, { status, reviewNotes });
			await fetchApprovals();
		} catch (reviewError: any) {
			setError(reviewError?.response?.data?.message || "Failed to review approval.");
		}
	};

	const onFormChange = <K extends keyof ApprovalFormValues>(
		key: K,
		value: ApprovalFormValues[K],
	) => {
		setFormValues((current) => ({ ...current, [key]: value }));
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setSubmitting(true);
		setFormError(null);

		try {
			if (!formValues.referenceId) {
				throw new Error("Please select a valid reference.");
			}

			if (editingApproval) {
				await approvalsAPI.update(editingApproval._id, toPayload(formValues));
			} else {
				await approvalsAPI.create(toPayload(formValues));
			}

			resetFormState();
			await fetchApprovals();
		} catch (submitError: any) {
			setFormError(
				submitError?.response?.data?.message ||
					submitError?.message ||
					"Unable to save approval.",
			);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen bg-stone-50 text-stone-900">
			<header className="border-b border-stone-200 bg-white">
				<div className="mx-auto flex w-full max-w-350 flex-wrap items-center justify-between gap-3 px-6 py-4">
					<div className="flex items-center gap-3">
						<div className="rounded-md bg-stone-900 p-2 text-white">
							<ClipboardCheck className="h-5 w-5" />
						</div>
						<div>
							<h1 className="text-xl font-semibold">Approvals Workflow</h1>
							<p className="text-sm text-stone-500">
								Role: {role || "Unknown"} • Submit, edit, review, archive,
								and restore approvals.
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<Link
							to="/dashboard"
							className="rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100">
							Back to Dashboard
						</Link>
						<button
							onClick={openCreate}
							className="inline-flex items-center gap-2 rounded-md bg-stone-900 px-3 py-2 text-sm font-medium text-white hover:bg-stone-700">
							<Plus className="h-4 w-4" />
							New Approval
						</button>
					</div>
				</div>
			</header>

			<main className="mx-auto w-full max-w-350 space-y-4 px-6 py-6">
				<section className="rounded-xl border border-stone-200 bg-white p-4">
					<div className="grid grid-cols-1 gap-3 md:grid-cols-5">
						<div className="relative md:col-span-2">
							<Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-stone-400" />
							<input
								value={search}
								onChange={(event) => setSearch(event.target.value)}
								placeholder="Search by title, type, or description"
								className="w-full rounded-md border border-stone-300 py-2 pl-9 pr-3 text-sm focus:border-stone-500 focus:outline-none"
							/>
						</div>

						<select
							value={selectedType}
							onChange={(event) => {
								setPage(1);
								setSelectedType(event.target.value as ApprovalType | "");
							}}
							className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none">
							<option value="">All types</option>
							{TYPE_OPTIONS.map((type) => (
								<option key={type} value={type}>
									{type}
								</option>
							))}
						</select>

						<select
							value={selectedStatus}
							onChange={(event) => {
								setPage(1);
								setSelectedStatus(
									event.target.value as ApprovalStatus | "",
								);
							}}
							className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none">
							<option value="">All statuses</option>
							{STATUS_OPTIONS.map((status) => (
								<option key={status} value={status}>
									{status}
								</option>
							))}
						</select>

						<label className="inline-flex items-center gap-2 rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-700">
							<input
								type="checkbox"
								checked={showArchived}
								onChange={(event) => {
									setPage(1);
									setShowArchived(event.target.checked);
								}}
							/>
							Show archived
						</label>
					</div>
				</section>

				{error ? (
					<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
						{error}
					</div>
				) : null}

				<section className="overflow-hidden rounded-xl border border-stone-200 bg-white">
					<div className="overflow-x-auto">
						<table className="w-full min-w-260 border-collapse">
							<thead className="bg-stone-100 text-left text-xs uppercase tracking-wide text-stone-600">
								<tr>
									<th className="px-4 py-3">Request</th>
									<th className="px-4 py-3">Reference</th>
									<th className="px-4 py-3">Status</th>
									<th className="px-4 py-3">Submitted By</th>
									<th className="px-4 py-3">Priority</th>
									<th className="px-4 py-3">Actions</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									<tr>
										<td
											colSpan={6}
											className="px-4 py-8 text-center text-sm text-stone-500">
											Loading approvals...
										</td>
									</tr>
								) : null}

								{!loading && filteredApprovals.length === 0 ? (
									<tr>
										<td
											colSpan={6}
											className="px-4 py-8 text-center text-sm text-stone-500">
											No approvals found.
										</td>
									</tr>
								) : null}

								{!loading
									? filteredApprovals.map((approval) => (
											<tr
												key={approval._id}
												className="border-t border-stone-200 text-sm">
												<td className="px-4 py-3">
													<p className="font-medium text-stone-900">
														{approval.title}
													</p>
													<p className="text-xs text-stone-500">
														{approval.type}
													</p>
												</td>
												<td className="px-4 py-3 text-stone-700">
													{resolveReferenceLabel(approval)}
												</td>
												<td className="px-4 py-3 text-stone-700">
													{approval.status}
												</td>
												<td className="px-4 py-3 text-stone-700">
													{submittedByName(approval)}
												</td>
												<td className="px-4 py-3 text-stone-700">
													{approval.isPriority
														? "High"
														: "Normal"}
												</td>
												<td className="px-4 py-3">
													<div className="flex flex-wrap items-center gap-2">
														{!showArchived ? (
															<>
																{canEditApproval(
																	approval,
																) ? (
																	<button
																		onClick={() =>
																			openEdit(
																				approval,
																			)
																		}
																		className="inline-flex items-center gap-1 rounded-md border border-stone-300 px-2 py-1 text-xs text-stone-700 hover:bg-stone-100">
																		<SquarePen className="h-3.5 w-3.5" />
																		Edit
																	</button>
																) : null}
																{canReview &&
																approval.status ===
																	"PENDING" ? (
																	<>
																		<button
																			onClick={() =>
																				handleReview(
																					approval,
																					"APPROVED",
																				)
																			}
																			className="inline-flex items-center gap-1 rounded-md border border-emerald-300 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50">
																			<CheckCircle2 className="h-3.5 w-3.5" />
																			Approve
																		</button>
																		<button
																			onClick={() =>
																				handleReview(
																					approval,
																					"REJECTED",
																				)
																			}
																			className="inline-flex items-center gap-1 rounded-md border border-amber-300 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50">
																			<XCircle className="h-3.5 w-3.5" />
																			Reject
																		</button>
																	</>
																) : null}
																{canArchive ? (
																	<button
																		onClick={() =>
																			handleArchive(
																				approval,
																			)
																		}
																		className="inline-flex items-center gap-1 rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50">
																		<Trash2 className="h-3.5 w-3.5" />
																		Archive
																	</button>
																) : null}
															</>
														) : canArchive ? (
															<button
																onClick={() =>
																	handleRestore(
																		approval,
																	)
																}
																className="inline-flex items-center gap-1 rounded-md border border-emerald-300 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50">
																<RotateCcw className="h-3.5 w-3.5" />
																Restore
															</button>
														) : null}
													</div>
												</td>
											</tr>
										))
									: null}
							</tbody>
						</table>
					</div>

					<div className="flex items-center justify-between border-t border-stone-200 px-4 py-3 text-sm">
						<p className="text-stone-600">
							Showing page {page} of {totalPages} ({total} records)
						</p>
						<div className="flex items-center gap-2">
							<button
								onClick={() =>
									setPage((current) => Math.max(1, current - 1))
								}
								disabled={page === 1 || loading}
								className="rounded-md border border-stone-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50">
								Previous
							</button>
							<button
								onClick={() =>
									setPage((current) => Math.min(totalPages, current + 1))
								}
								disabled={page >= totalPages || loading}
								className="rounded-md border border-stone-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50">
								Next
							</button>
						</div>
					</div>
				</section>
			</main>

			{showForm ? (
				<div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
					<div className="w-full max-w-2xl rounded-xl border border-stone-200 bg-white p-5 shadow-2xl">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-lg font-semibold">
								{editingApproval ? "Edit Approval" : "Create Approval"}
							</h2>
							<button
								onClick={closeForm}
								className="rounded-md border border-stone-300 px-2 py-1 text-sm text-stone-600 hover:bg-stone-100">
								Close
							</button>
						</div>

						{formError ? (
							<div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
								{formError}
							</div>
						) : null}

						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
								<select
									required
									value={formValues.type}
									onChange={(event) =>
										onFormChange(
											"type",
											event.target.value as ApprovalType,
										)
									}
									className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none">
									{TYPE_OPTIONS.map((type) => (
										<option key={type} value={type}>
											{type}
										</option>
									))}
								</select>

								<select
									required
									value={formValues.referenceId}
									onChange={(event) =>
										onFormChange("referenceId", event.target.value)
									}
									className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none">
									<option value="">Select reference</option>
									{referenceOptions.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>

								<input
									required
									value={formValues.title}
									onChange={(event) =>
										onFormChange("title", event.target.value)
									}
									placeholder="Approval title"
									className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
								/>

								<label className="inline-flex items-center gap-2 rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-700">
									<input
										type="checkbox"
										checked={formValues.isPriority}
										onChange={(event) =>
											onFormChange(
												"isPriority",
												event.target.checked,
											)
										}
									/>
									Mark as high priority
								</label>
							</div>

							<textarea
								value={formValues.description}
								onChange={(event) =>
									onFormChange("description", event.target.value)
								}
								placeholder="Optional details"
								className="h-24 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
							/>

							<div className="flex items-center justify-end gap-2">
								<button
									type="button"
									onClick={closeForm}
									className="rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-700 hover:bg-stone-100">
									Cancel
								</button>
								<button
									type="submit"
									disabled={submitting}
									className="inline-flex items-center gap-2 rounded-md bg-stone-900 px-3 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-70">
									<Plus className="h-4 w-4" />
									{submitting
										? "Saving..."
										: editingApproval
											? "Update Approval"
											: "Create Approval"}
								</button>
							</div>
						</form>
					</div>
				</div>
			) : null}
		</div>
	);
};

export default Approvals;
