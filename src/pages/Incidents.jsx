import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { AlertTriangle, Plus, Search, SquarePen, Trash2, RotateCcw } from "lucide-react";
import { incidentsAPI, sitesAPI, usersAPI } from "../services/api";

const PAGE_SIZE = 10;
const TYPE_OPTIONS = ["STRUCTURAL", "VANDALISM", "OVERCROWDING", "ENVIRONMENTAL", "SECURITY"];
const SEVERITY_OPTIONS = ["LOW", "MEDIUM", "HIGH"];
const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "RESOLVED"];

const EMPTY_FORM = {
	siteId: "",
	type: "STRUCTURAL",
	severity: "LOW",
	description: "",
	status: "OPEN",
	resolutionNotes: "",
};

const toSiteId = (value) => {
	if (typeof value === "string") {
		return value;
	}

	return value._id;
};

const toSiteLabel = (value, allSites) => {
	if (typeof value !== "string") {
		return `${value.name} (${value.district}, ${value.state})`;
	}

	const site = allSites.find((candidate) => candidate._id === value);
	if (!site) {
		return "Unknown Site";
	}

	return `${site.name} (${site.district}, ${site.state})`;
};

const toCreatePayload = (values) => ({
	siteId: values.siteId,
	type: values.type,
	severity: values.severity,
	description: values.description.trim(),
});

const toUpdatePayload = (values) => ({
	siteId: values.siteId,
	type: values.type,
	severity: values.severity,
	description: values.description.trim(),
	status: values.status,
	...(values.resolutionNotes.trim() ? { resolutionNotes: values.resolutionNotes.trim() } : {}),
});

const toFormValues = (incident) => ({
	siteId: toSiteId(incident.siteId),
	type: incident.type,
	severity: incident.severity,
	description: incident.description,
	status: incident.status,
	resolutionNotes: incident.resolutionNotes || "",
});

const Incidents = () => {
	const { isLoaded } = useAuth();

	const [role, setRole] = useState(null);
	const [sites, setSites] = useState([]);
	const [incidents, setIncidents] = useState([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState(null);

	const [search, setSearch] = useState("");
	const [selectedSite, setSelectedSite] = useState("");
	const [selectedSeverity, setSelectedSeverity] = useState("");
	const [selectedStatus, setSelectedStatus] = useState("");
	const [showArchived, setShowArchived] = useState(false);

	const [showForm, setShowForm] = useState(false);
	const [editingIncident, setEditingIncident] = useState(null);
	const [formValues, setFormValues] = useState(EMPTY_FORM);
	const [formError, setFormError] = useState(null);

	const canArchive = role === "NATIONAL_ADMIN" || role === "STATE_ADMIN";

	const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

	const filteredIncidents = useMemo(() => {
		if (!search.trim()) {
			return incidents;
		}

		const needle = search.trim().toLowerCase();
		return incidents.filter((incident) => {
			const siteLabel = toSiteLabel(incident.siteId, sites).toLowerCase();
			return (
				incident.description.toLowerCase().includes(needle) ||
				incident.type.toLowerCase().includes(needle) ||
				siteLabel.includes(needle)
			);
		});
	}, [incidents, search, sites]);

	const initializeContext = useCallback(async () => {
		if (!isLoaded) {
			return;
		}

		try {
			const [meResponse, sitesResponse] = await Promise.all([
				usersAPI.getMe(),
				sitesAPI.getAll({ limit: 1000 }),
			]);

			const currentRole = meResponse.data?.role || null;
			const preferredSiteId =
				typeof meResponse.data?.siteId === "string" ? meResponse.data.siteId : "";

			setRole(currentRole);

			const loadedSites = sitesResponse.data?.sites || [];
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
		} catch (contextError) {
			setError(
				contextError?.response?.data?.message ||
					"Failed to initialize incident context.",
			);
		}
	}, [isLoaded]);

	const fetchIncidents = useCallback(async () => {
		if (!isLoaded) {
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const { data } = await incidentsAPI.getAll({
				page,
				limit: PAGE_SIZE,
				...(selectedSite ? { siteId: selectedSite } : {}),
				...(selectedSeverity ? { severity: selectedSeverity } : {}),
				...(selectedStatus ? { status: selectedStatus } : {}),
				...(showArchived ? { archived: true } : {}),
			});

			setIncidents(data?.incidents || []);
			setTotal(data?.total || 0);
		} catch (incidentError) {
			setError(incidentError?.response?.data?.message || "Failed to load incidents.");
		} finally {
			setLoading(false);
		}
	}, [isLoaded, page, selectedSeverity, selectedSite, selectedStatus, showArchived]);

	useEffect(() => {
		initializeContext();
	}, [initializeContext]);

	useEffect(() => {
		fetchIncidents();
	}, [fetchIncidents]);

	const openCreate = () => {
		setEditingIncident(null);
		setFormValues({
			...EMPTY_FORM,
			siteId: selectedSite || sites[0]?._id || "",
		});
		setFormError(null);
		setShowForm(true);
	};

	const openEdit = (incident) => {
		setEditingIncident(incident);
		setFormValues(toFormValues(incident));
		setFormError(null);
		setShowForm(true);
	};

	const resetFormState = () => {
		setShowForm(false);
		setEditingIncident(null);
		setFormValues(EMPTY_FORM);
		setFormError(null);
	};

	const closeForm = () => {
		if (submitting) {
			return;
		}

		resetFormState();
	};

	const handleArchive = async (incident) => {
		if (!canArchive) {
			setError("Only admins can archive incidents.");
			return;
		}

		const shouldArchive = window.confirm("Archive this incident?");
		if (!shouldArchive) {
			return;
		}

		try {
			await incidentsAPI.remove(incident._id);
			await fetchIncidents();
		} catch (archiveError) {
			setError(archiveError?.response?.data?.message || "Failed to archive incident.");
		}
	};

	const handleRestore = async (incident) => {
		if (!canArchive) {
			setError("Only admins can restore incidents.");
			return;
		}

		try {
			await incidentsAPI.restore(incident._id);
			await fetchIncidents();
		} catch (restoreError) {
			setError(restoreError?.response?.data?.message || "Failed to restore incident.");
		}
	};

	const onFormChange = (key, value) => {
		setFormValues((current) => ({ ...current, [key]: value }));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setSubmitting(true);
		setFormError(null);

		try {
			if (!formValues.siteId) {
				throw new Error("Please select a site.");
			}

			if (editingIncident) {
				await incidentsAPI.update(editingIncident._id, toUpdatePayload(formValues));
			} else {
				await incidentsAPI.create(toCreatePayload(formValues));
			}

			resetFormState();
			await fetchIncidents();
		} catch (submitError) {
			setFormError(
				submitError?.response?.data?.message ||
					submitError?.message ||
					"Unable to save incident.",
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
							<AlertTriangle className="h-5 w-5" />
						</div>
						<div>
							<h1 className="text-xl font-semibold">Incidents Management</h1>
							<p className="text-sm text-stone-500">
								Role: {role || "Unknown"} • Report and track operational
								incidents.
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
							New Incident
						</button>
					</div>
				</div>
			</header>

			<main className="mx-auto w-full max-w-350 space-y-4 px-6 py-6">
				<section className="rounded-xl border border-stone-200 bg-white p-4">
					<div className="grid grid-cols-1 gap-3 md:grid-cols-6">
						<div className="relative md:col-span-2">
							<Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-stone-400" />
							<input
								value={search}
								onChange={(event) => setSearch(event.target.value)}
								placeholder="Search by site, type, or description"
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
							value={selectedSeverity}
							onChange={(event) => {
								setPage(1);
								setSelectedSeverity(event.target.value);
							}}
							className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none">
							<option value="">All severities</option>
							{SEVERITY_OPTIONS.map((option) => (
								<option key={option} value={option}>
									{option}
								</option>
							))}
						</select>

						<select
							value={selectedStatus}
							onChange={(event) => {
								setPage(1);
								setSelectedStatus(event.target.value);
							}}
							className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none">
							<option value="">All statuses</option>
							{STATUS_OPTIONS.map((option) => (
								<option key={option} value={option}>
									{option}
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
						<table className="w-full min-w-240 border-collapse">
							<thead className="bg-stone-100 text-left text-xs uppercase tracking-wide text-stone-600">
								<tr>
									<th className="px-4 py-3">Type</th>
									<th className="px-4 py-3">Site</th>
									<th className="px-4 py-3">Severity</th>
									<th className="px-4 py-3">Status</th>
									<th className="px-4 py-3">Reported By</th>
									<th className="px-4 py-3">Actions</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									<tr>
										<td
											colSpan={6}
											className="px-4 py-8 text-center text-sm text-stone-500">
											Loading incidents...
										</td>
									</tr>
								) : null}

								{!loading && filteredIncidents.length === 0 ? (
									<tr>
										<td
											colSpan={6}
											className="px-4 py-8 text-center text-sm text-stone-500">
											No incidents found.
										</td>
									</tr>
								) : null}

								{!loading
									? filteredIncidents.map((incident) => (
											<tr
												key={incident._id}
												className="border-t border-stone-200 text-sm">
												<td className="px-4 py-3">
													<p className="font-medium text-stone-900">
														{incident.type}
													</p>
													<p className="text-xs text-stone-500">
														{incident.description}
													</p>
												</td>
												<td className="px-4 py-3 text-stone-700">
													{toSiteLabel(incident.siteId, sites)}
												</td>
												<td className="px-4 py-3 text-stone-700">
													{incident.severity}
												</td>
												<td className="px-4 py-3 text-stone-700">
													{incident.status}
												</td>
												<td className="px-4 py-3 text-stone-700">
													{incident.reportedBy?.name ||
														incident.reportedBy?.email ||
														"Unknown"}
												</td>
												<td className="px-4 py-3">
													<div className="flex items-center gap-2">
														{!showArchived ? (
															<>
																<button
																	onClick={() =>
																		openEdit(incident)
																	}
																	className="inline-flex items-center gap-1 rounded-md border border-stone-300 px-2 py-1 text-xs text-stone-700 hover:bg-stone-100">
																	<SquarePen className="h-3.5 w-3.5" />
																	Edit
																</button>
																{canArchive ? (
																	<button
																		onClick={() =>
																			handleArchive(
																				incident,
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
																	handleRestore(incident)
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
								{editingIncident ? "Edit Incident" : "Report Incident"}
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

								<select
									required
									value={formValues.type}
									onChange={(event) =>
										onFormChange("type", event.target.value)
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
									value={formValues.severity}
									onChange={(event) =>
										onFormChange("severity", event.target.value)
									}
									className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none">
									{SEVERITY_OPTIONS.map((severity) => (
										<option key={severity} value={severity}>
											{severity}
										</option>
									))}
								</select>

								{editingIncident ? (
									<select
										required
										value={formValues.status}
										onChange={(event) =>
											onFormChange("status", event.target.value)
										}
										className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none">
										{STATUS_OPTIONS.map((status) => (
											<option key={status} value={status}>
												{status}
											</option>
										))}
									</select>
								) : null}
							</div>

							<textarea
								required
								value={formValues.description}
								onChange={(event) =>
									onFormChange("description", event.target.value)
								}
								placeholder="Describe the incident"
								className="h-24 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
							/>

							{editingIncident ? (
								<textarea
									value={formValues.resolutionNotes}
									onChange={(event) =>
										onFormChange("resolutionNotes", event.target.value)
									}
									placeholder="Optional resolution notes"
									className="h-20 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
								/>
							) : null}

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
										: editingIncident
											? "Update Incident"
											: "Create Incident"}
								</button>
							</div>
						</form>
					</div>
				</div>
			) : null}
		</div>
	);
};

export default Incidents;
