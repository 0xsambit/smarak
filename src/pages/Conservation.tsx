import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { Wrench, Plus, Search, SquarePen, Trash2, RotateCcw } from "lucide-react";
import { conservationAPI, setAuthTokenProvider, sitesAPI, usersAPI } from "../services/api";

type UserRole = "NATIONAL_ADMIN" | "STATE_ADMIN" | "SITE_OFFICER";
type ConservationStatus = "PLANNED" | "ONGOING" | "COMPLETED" | "CANCELLED";

interface SiteSummary {
	_id: string;
	name: string;
	state: string;
	district: string;
}

interface ConservationRecord {
	_id: string;
	siteId: string | SiteSummary;
	issueType: string;
	title: string;
	description: string;
	contractor: string;
	budget: number;
	status: ConservationStatus;
	startDate: string;
	endDate?: string;
	completionNotes?: string;
}

interface ConservationFormValues {
	siteId: string;
	issueType: string;
	title: string;
	description: string;
	contractor: string;
	budget: string;
	status: ConservationStatus;
	startDate: string;
	endDate: string;
	completionNotes: string;
}

const PAGE_SIZE = 10;
const STATUS_OPTIONS: ConservationStatus[] = ["PLANNED", "ONGOING", "COMPLETED", "CANCELLED"];

const EMPTY_FORM: ConservationFormValues = {
	siteId: "",
	issueType: "",
	title: "",
	description: "",
	contractor: "",
	budget: "",
	status: "PLANNED",
	startDate: "",
	endDate: "",
	completionNotes: "",
};

const toSiteId = (value: string | SiteSummary): string =>
	typeof value === "string" ? value : value._id;

const toSiteLabel = (value: string | SiteSummary, allSites: SiteSummary[]): string => {
	if (typeof value !== "string") {
		return `${value.name} (${value.district}, ${value.state})`;
	}

	const site = allSites.find((candidate) => candidate._id === value);
	if (!site) {
		return "Unknown Site";
	}

	return `${site.name} (${site.district}, ${site.state})`;
};

const toCreatePayload = (values: ConservationFormValues) => ({
	siteId: values.siteId,
	issueType: values.issueType.trim(),
	title: values.title.trim(),
	description: values.description.trim(),
	contractor: values.contractor.trim(),
	budget: Number(values.budget),
	status: values.status,
	startDate: values.startDate,
	...(values.endDate ? { endDate: values.endDate } : {}),
});

const toUpdatePayload = (values: ConservationFormValues) => ({
	siteId: values.siteId,
	issueType: values.issueType.trim(),
	title: values.title.trim(),
	description: values.description.trim(),
	contractor: values.contractor.trim(),
	budget: Number(values.budget),
	status: values.status,
	startDate: values.startDate,
	...(values.endDate ? { endDate: values.endDate } : {}),
	...(values.completionNotes.trim() ? { completionNotes: values.completionNotes.trim() } : {}),
});

const toFormValues = (project: ConservationRecord): ConservationFormValues => ({
	siteId: toSiteId(project.siteId),
	issueType: project.issueType,
	title: project.title,
	description: project.description,
	contractor: project.contractor,
	budget: String(project.budget),
	status: project.status,
	startDate: project.startDate ? new Date(project.startDate).toISOString().slice(0, 10) : "",
	endDate: project.endDate ? new Date(project.endDate).toISOString().slice(0, 10) : "",
	completionNotes: project.completionNotes || "",
});

const Conservation: React.FC = () => {
	const { isLoaded, getToken } = useAuth();

	const [role, setRole] = useState<UserRole | null>(null);
	const [sites, setSites] = useState<SiteSummary[]>([]);
	const [projects, setProjects] = useState<ConservationRecord[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [search, setSearch] = useState("");
	const [selectedSite, setSelectedSite] = useState("");
	const [selectedStatus, setSelectedStatus] = useState<ConservationStatus | "">("");
	const [showArchived, setShowArchived] = useState(false);

	const [showForm, setShowForm] = useState(false);
	const [editingProject, setEditingProject] = useState<ConservationRecord | null>(null);
	const [formValues, setFormValues] = useState<ConservationFormValues>(EMPTY_FORM);
	const [formError, setFormError] = useState<string | null>(null);

	useEffect(() => {
		if (!isLoaded) {
			return;
		}

		setAuthTokenProvider(() => getToken());
		return () => setAuthTokenProvider(null);
	}, [getToken, isLoaded]);

	const canManage = role === "NATIONAL_ADMIN" || role === "STATE_ADMIN";
	const canArchive = role === "NATIONAL_ADMIN";

	const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

	const filteredProjects = useMemo(() => {
		if (!search.trim()) {
			return projects;
		}

		const needle = search.trim().toLowerCase();
		return projects.filter((project) => {
			const siteLabel = toSiteLabel(project.siteId, sites).toLowerCase();
			return (
				project.title.toLowerCase().includes(needle) ||
				project.issueType.toLowerCase().includes(needle) ||
				siteLabel.includes(needle)
			);
		});
	}, [projects, search, sites]);

	const initializeContext = useCallback(async () => {
		if (!isLoaded) {
			return;
		}

		try {
			const [meResponse, sitesResponse] = await Promise.all([
				usersAPI.getMe(),
				sitesAPI.getAll({ limit: 1000 }),
			]);

			const currentRole = (meResponse.data?.role || null) as UserRole | null;
			const preferredSiteId =
				typeof meResponse.data?.siteId === "string" ? meResponse.data.siteId : "";

			setRole(currentRole);

			const loadedSites = (sitesResponse.data?.sites || []) as SiteSummary[];
			setSites(loadedSites);
			if (loadedSites.length > 0) {
				setSelectedSite((current) => {
					if (current) {
						return current;
					}

					if (currentRole === "SITE_OFFICER") {
						return preferredSiteId || loadedSites[0]._id;
					}

					return "";
				});

				setFormValues((current) => ({
					...current,
					siteId: current.siteId || preferredSiteId || loadedSites[0]._id,
				}));
			}
		} catch (contextError: any) {
			setError(
				contextError?.response?.data?.message ||
					"Failed to initialize conservation context.",
			);
		}
	}, [isLoaded]);

	const fetchProjects = useCallback(async () => {
		if (!isLoaded) {
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const { data } = await conservationAPI.getAll({
				page,
				limit: PAGE_SIZE,
				...(selectedSite ? { siteId: selectedSite } : {}),
				...(selectedStatus ? { status: selectedStatus } : {}),
				archived: showArchived,
			});

			setProjects((data?.projects || []) as ConservationRecord[]);
			setTotal(data?.total || 0);
		} catch (projectError: any) {
			setError(
				projectError?.response?.data?.message ||
					"Failed to load conservation projects.",
			);
		} finally {
			setLoading(false);
		}
	}, [isLoaded, page, selectedSite, selectedStatus, showArchived]);

	useEffect(() => {
		initializeContext();
	}, [initializeContext]);

	useEffect(() => {
		fetchProjects();
	}, [fetchProjects]);

	const openCreate = () => {
		if (!canManage) {
			setError("Only admins can create or update conservation projects.");
			return;
		}

		setEditingProject(null);
		setFormValues({
			...EMPTY_FORM,
			siteId: selectedSite || sites[0]?._id || "",
		});
		setFormError(null);
		setShowForm(true);
	};

	const openEdit = (project: ConservationRecord) => {
		if (!canManage) {
			setError("Only admins can create or update conservation projects.");
			return;
		}

		setEditingProject(project);
		setFormValues(toFormValues(project));
		setFormError(null);
		setShowForm(true);
	};

	const resetFormState = () => {
		setShowForm(false);
		setEditingProject(null);
		setFormValues(EMPTY_FORM);
		setFormError(null);
	};

	const closeForm = () => {
		if (submitting) {
			return;
		}

		resetFormState();
	};

	const handleArchive = async (project: ConservationRecord) => {
		if (!canArchive) {
			setError("Only national admins can archive conservation projects.");
			return;
		}

		const shouldArchive = window.confirm("Archive this conservation project?");
		if (!shouldArchive) {
			return;
		}

		try {
			await conservationAPI.remove(project._id);
			await fetchProjects();
		} catch (archiveError: any) {
			setError(
				archiveError?.response?.data?.message ||
					"Failed to archive conservation project.",
			);
		}
	};

	const handleRestore = async (project: ConservationRecord) => {
		if (!canArchive) {
			setError("Only national admins can restore conservation projects.");
			return;
		}

		try {
			await conservationAPI.restore(project._id);
			await fetchProjects();
		} catch (restoreError: any) {
			setError(
				restoreError?.response?.data?.message ||
					"Failed to restore conservation project.",
			);
		}
	};

	const onFormChange = <K extends keyof ConservationFormValues>(
		key: K,
		value: ConservationFormValues[K],
	) => {
		setFormValues((current) => ({ ...current, [key]: value }));
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!canManage) {
			setFormError("Only admins can create or update conservation projects.");
			return;
		}

		setSubmitting(true);
		setFormError(null);

		try {
			if (!formValues.siteId) {
				throw new Error("Please select a site.");
			}

			if (!formValues.budget || Number.isNaN(Number(formValues.budget))) {
				throw new Error("Please enter a valid budget.");
			}

			if (editingProject) {
				await conservationAPI.update(editingProject._id, toUpdatePayload(formValues));
			} else {
				await conservationAPI.create(toCreatePayload(formValues));
			}

			resetFormState();
			await fetchProjects();
		} catch (submitError: any) {
			setFormError(
				submitError?.response?.data?.message ||
					submitError?.message ||
					"Unable to save conservation project.",
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
							<Wrench className="h-5 w-5" />
						</div>
						<div>
							<h1 className="text-xl font-semibold">Conservation Projects</h1>
							<p className="text-sm text-stone-500">
								Role: {role || "Unknown"} • Plan and execute restoration
								programs.
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<Link
							to="/dashboard"
							className="rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100">
							Back to Dashboard
						</Link>
						{canManage ? (
							<button
								onClick={openCreate}
								className="inline-flex items-center gap-2 rounded-md bg-stone-900 px-3 py-2 text-sm font-medium text-white hover:bg-stone-700">
								<Plus className="h-4 w-4" />
								New Project
							</button>
						) : null}
					</div>
				</div>
			</header>

			<main className="mx-auto w-full max-w-350 space-y-4 px-6 py-6">
				{!canManage ? (
					<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
						You have read-only access to conservation projects. Admin role is
						required for create and update.
					</div>
				) : null}

				<section className="rounded-xl border border-stone-200 bg-white p-4">
					<div className="grid grid-cols-1 gap-3 md:grid-cols-5">
						<div className="relative md:col-span-2">
							<Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-stone-400" />
							<input
								value={search}
								onChange={(event) => setSearch(event.target.value)}
								placeholder="Search by title, issue type, or site"
								className="w-full rounded-md border border-stone-300 py-2 pl-9 pr-3 text-sm focus:border-stone-500 focus:outline-none"
							/>
						</div>

						<select
							value={selectedSite}
							onChange={(event) => {
								setPage(1);
								setSelectedSite(event.target.value);
							}}
							className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none">
							<option value="">All sites</option>
							{sites.map((site) => (
								<option key={site._id} value={site._id}>
									{site.name}
								</option>
							))}
						</select>

						<select
							value={selectedStatus}
							onChange={(event) => {
								setPage(1);
								setSelectedStatus(
									event.target.value as ConservationStatus | "",
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
						<table className="w-full min-w-250 border-collapse">
							<thead className="bg-stone-100 text-left text-xs uppercase tracking-wide text-stone-600">
								<tr>
									<th className="px-4 py-3">Project</th>
									<th className="px-4 py-3">Site</th>
									<th className="px-4 py-3">Status</th>
									<th className="px-4 py-3">Budget</th>
									<th className="px-4 py-3">Timeline</th>
									<th className="px-4 py-3">Actions</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									<tr>
										<td
											colSpan={6}
											className="px-4 py-8 text-center text-sm text-stone-500">
											Loading conservation projects...
										</td>
									</tr>
								) : null}

								{!loading && filteredProjects.length === 0 ? (
									<tr>
										<td
											colSpan={6}
											className="px-4 py-8 text-center text-sm text-stone-500">
											No projects found.
										</td>
									</tr>
								) : null}

								{!loading
									? filteredProjects.map((project) => (
											<tr
												key={project._id}
												className="border-t border-stone-200 text-sm">
												<td className="px-4 py-3">
													<p className="font-medium text-stone-900">
														{project.title}
													</p>
													<p className="text-xs text-stone-500">
														{project.issueType}
													</p>
												</td>
												<td className="px-4 py-3 text-stone-700">
													{toSiteLabel(
														project.siteId,
														sites,
													)}
												</td>
												<td className="px-4 py-3 text-stone-700">
													{project.status}
												</td>
												<td className="px-4 py-3 text-stone-700">
													{project.budget.toLocaleString(
														"en-IN",
													)}
												</td>
												<td className="px-4 py-3 text-stone-700">
													{new Date(
														project.startDate,
													).toLocaleDateString("en-IN")}
													{project.endDate
														? ` - ${new Date(project.endDate).toLocaleDateString("en-IN")}`
														: ""}
												</td>
												<td className="px-4 py-3">
													<div className="flex items-center gap-2">
														{!showArchived ? (
															<>
																{canManage ? (
																	<button
																		onClick={() =>
																			openEdit(
																				project,
																			)
																		}
																		className="inline-flex items-center gap-1 rounded-md border border-stone-300 px-2 py-1 text-xs text-stone-700 hover:bg-stone-100">
																		<SquarePen className="h-3.5 w-3.5" />
																		Edit
																	</button>
																) : null}
																{canArchive ? (
																	<button
																		onClick={() =>
																			handleArchive(
																				project,
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
																		project,
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

			{showForm && canManage ? (
				<div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
					<div className="w-full max-w-2xl rounded-xl border border-stone-200 bg-white p-5 shadow-2xl">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-lg font-semibold">
								{editingProject
									? "Edit Conservation Project"
									: "Create Conservation Project"}
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
									value={formValues.siteId}
									onChange={(event) =>
										onFormChange("siteId", event.target.value)
									}
									className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none">
									<option value="">Select site</option>
									{sites.map((site) => (
										<option key={site._id} value={site._id}>
											{site.name}
										</option>
									))}
								</select>

								<input
									required
									value={formValues.issueType}
									onChange={(event) =>
										onFormChange("issueType", event.target.value)
									}
									placeholder="Issue type"
									className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
								/>

								<input
									required
									value={formValues.title}
									onChange={(event) =>
										onFormChange("title", event.target.value)
									}
									placeholder="Project title"
									className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
								/>

								<input
									required
									value={formValues.contractor}
									onChange={(event) =>
										onFormChange("contractor", event.target.value)
									}
									placeholder="Contractor"
									className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
								/>

								<input
									required
									type="number"
									value={formValues.budget}
									onChange={(event) =>
										onFormChange("budget", event.target.value)
									}
									placeholder="Budget"
									className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
								/>

								<select
									required
									value={formValues.status}
									onChange={(event) =>
										onFormChange(
											"status",
											event.target.value as ConservationStatus,
										)
									}
									className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none">
									{STATUS_OPTIONS.map((status) => (
										<option key={status} value={status}>
											{status}
										</option>
									))}
								</select>

								<input
									required
									type="date"
									value={formValues.startDate}
									onChange={(event) =>
										onFormChange("startDate", event.target.value)
									}
									className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
								/>

								<input
									type="date"
									value={formValues.endDate}
									onChange={(event) =>
										onFormChange("endDate", event.target.value)
									}
									className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
								/>
							</div>

							<textarea
								required
								value={formValues.description}
								onChange={(event) =>
									onFormChange("description", event.target.value)
								}
								placeholder="Project description"
								className="h-24 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
							/>

							<textarea
								value={formValues.completionNotes}
								onChange={(event) =>
									onFormChange("completionNotes", event.target.value)
								}
								placeholder="Optional completion notes"
								className="h-20 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
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
										: editingProject
											? "Update Project"
											: "Create Project"}
								</button>
							</div>
						</form>
					</div>
				</div>
			) : null}
		</div>
	);
};

export default Conservation;
