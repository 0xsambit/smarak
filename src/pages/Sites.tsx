import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { Building2, Plus, Search, SquarePen, Trash2, RotateCcw } from "lucide-react";
import { setAuthTokenProvider, sitesAPI, usersAPI } from "../services/api";
import type {
	ProtectionStatus,
	RiskLevel,
	SiteFormValues,
	SiteRecord,
	SitesListResponse,
} from "../types/site";

const PAGE_SIZE = 10;

type UserRole = "NATIONAL_ADMIN" | "STATE_ADMIN" | "SITE_OFFICER";

const PROTECTION_OPTIONS: ProtectionStatus[] = ["PROTECTED", "RESTRICTED", "OPEN"];
const RISK_OPTIONS: RiskLevel[] = ["LOW", "MEDIUM", "HIGH"];

const EMPTY_FORM: SiteFormValues = {
	name: "",
	state: "",
	district: "",
	longitude: "",
	latitude: "",
	protectionStatus: "OPEN",
	riskLevel: "LOW",
	visitorCapacity: "",
	lastInspectionDate: "",
	description: "",
};

const parseSiteFormPayload = (values: SiteFormValues) => ({
	name: values.name.trim(),
	state: values.state.trim(),
	district: values.district.trim(),
	coordinates: {
		longitude: Number(values.longitude),
		latitude: Number(values.latitude),
	},
	protectionStatus: values.protectionStatus,
	riskLevel: values.riskLevel,
	visitorCapacity: Number(values.visitorCapacity),
	...(values.lastInspectionDate ? { lastInspectionDate: values.lastInspectionDate } : {}),
	...(values.description.trim() ? { description: values.description.trim() } : {}),
});

const toFormValues = (site: SiteRecord): SiteFormValues => ({
	name: site.name,
	state: site.state,
	district: site.district,
	longitude: String(site.coordinates?.coordinates?.[0] ?? ""),
	latitude: String(site.coordinates?.coordinates?.[1] ?? ""),
	protectionStatus: site.protectionStatus,
	riskLevel: site.riskLevel,
	visitorCapacity: String(site.visitorCapacity ?? ""),
	lastInspectionDate: site.lastInspectionDate
		? new Date(site.lastInspectionDate).toISOString().slice(0, 10)
		: "",
	description: site.description ?? "",
});

const Sites: React.FC = () => {
	const { isLoaded, getToken } = useAuth();

	const [sites, setSites] = useState<SiteRecord[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [search, setSearch] = useState("");
	const [stateFilter, setStateFilter] = useState("");
	const [riskFilter, setRiskFilter] = useState<RiskLevel | "">("");
	const [protectionFilter, setProtectionFilter] = useState<ProtectionStatus | "">("");
	const [showArchived, setShowArchived] = useState(false);

	const [showForm, setShowForm] = useState(false);
	const [editingSite, setEditingSite] = useState<SiteRecord | null>(null);
	const [formValues, setFormValues] = useState<SiteFormValues>(EMPTY_FORM);
	const [formError, setFormError] = useState<string | null>(null);
	const [currentRole, setCurrentRole] = useState<UserRole | null>(null);

	useEffect(() => {
		if (!isLoaded) {
			return;
		}

		setAuthTokenProvider(() => getToken());
		return () => setAuthTokenProvider(null);
	}, [getToken, isLoaded]);

	useEffect(() => {
		if (!isLoaded) {
			return;
		}

		let cancelled = false;

		const loadRole = async () => {
			try {
				const { data } = await usersAPI.getMe();
				if (!cancelled) {
					setCurrentRole(data?.role as UserRole);
				}
			} catch {
				if (!cancelled) {
					setCurrentRole(null);
				}
			}
		};

		loadRole();

		return () => {
			cancelled = true;
		};
	}, [isLoaded]);

	const canManageSites = currentRole === "NATIONAL_ADMIN" || currentRole === "STATE_ADMIN";
	const canArchiveSites = currentRole === "NATIONAL_ADMIN";

	const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

	const fetchSites = useCallback(async () => {
		if (!isLoaded) {
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const { data } = await sitesAPI.getAll({
				page,
				limit: PAGE_SIZE,
				...(search.trim() ? { search: search.trim() } : {}),
				...(stateFilter.trim() ? { state: stateFilter.trim() } : {}),
				...(riskFilter ? { riskLevel: riskFilter } : {}),
				...(protectionFilter ? { protectionStatus: protectionFilter } : {}),
				archived: showArchived,
			});

			const payload = data as SitesListResponse;
			setSites(payload.sites || []);
			setTotal(payload.total || 0);
		} catch (sitesError: any) {
			setError(sitesError?.response?.data?.message || "Failed to load sites.");
		} finally {
			setLoading(false);
		}
	}, [isLoaded, page, search, stateFilter, riskFilter, protectionFilter, showArchived]);

	useEffect(() => {
		fetchSites();
	}, [fetchSites]);

	const openCreate = () => {
		if (!canManageSites) {
			setError("Only admins can create or update sites.");
			return;
		}

		setEditingSite(null);
		setFormValues(EMPTY_FORM);
		setFormError(null);
		setShowForm(true);
	};

	const openEdit = (site: SiteRecord) => {
		if (!canManageSites) {
			setError("Only admins can create or update sites.");
			return;
		}

		setEditingSite(site);
		setFormValues(toFormValues(site));
		setFormError(null);
		setShowForm(true);
	};

	const resetFormState = () => {
		setShowForm(false);
		setEditingSite(null);
		setFormValues(EMPTY_FORM);
		setFormError(null);
	};

	const closeForm = () => {
		if (submitting) {
			return;
		}

		resetFormState();
	};

	const handleArchive = async (site: SiteRecord) => {
		if (!canArchiveSites) {
			setError("Only national admins can archive or restore sites.");
			return;
		}

		const shouldArchive = window.confirm(`Archive site \"${site.name}\"?`);

		if (!shouldArchive) {
			return;
		}

		try {
			await sitesAPI.remove(site._id);
			await fetchSites();
		} catch (archiveError: any) {
			setError(archiveError?.response?.data?.message || "Failed to archive site.");
		}
	};

	const handleRestore = async (site: SiteRecord) => {
		if (!canArchiveSites) {
			setError("Only national admins can archive or restore sites.");
			return;
		}

		try {
			await sitesAPI.restore(site._id);
			await fetchSites();
		} catch (restoreError: any) {
			setError(restoreError?.response?.data?.message || "Failed to restore site.");
		}
	};

	const onFormChange = <K extends keyof SiteFormValues>(key: K, value: SiteFormValues[K]) => {
		setFormValues((current) => ({ ...current, [key]: value }));
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!canManageSites) {
			setFormError("Only admins can create or update sites.");
			return;
		}

		setSubmitting(true);
		setFormError(null);

		try {
			const payload = parseSiteFormPayload(formValues);

			if (editingSite) {
				await sitesAPI.update(editingSite._id, payload);
			} else {
				await sitesAPI.create(payload);
			}

			resetFormState();
			await fetchSites();
		} catch (submitError: any) {
			setFormError(submitError?.response?.data?.message || "Unable to save site.");
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
							<Building2 className="h-5 w-5" />
						</div>
						<div>
							<h1 className="text-xl font-semibold">Sites Management</h1>
							<p className="text-sm text-stone-500">
								Create, update, archive, and restore heritage sites.
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<Link
							to="/dashboard"
							className="rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100">
							Back to Dashboard
						</Link>
						{canManageSites ? (
							<button
								onClick={openCreate}
								className="inline-flex items-center gap-2 rounded-md bg-stone-900 px-3 py-2 text-sm font-medium text-white hover:bg-stone-700">
								<Plus className="h-4 w-4" />
								New Site
							</button>
						) : null}
					</div>
				</div>
			</header>

			<main className="mx-auto w-full max-w-350 space-y-4 px-6 py-6">
				{!canManageSites ? (
					<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
						You have read-only access to site data. Admin role is required for
						create or update actions.
					</div>
				) : null}

				<section className="rounded-xl border border-stone-200 bg-white p-4">
					<div className="grid grid-cols-1 gap-3 md:grid-cols-6">
						<div className="relative md:col-span-2">
							<Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-stone-400" />
							<input
								value={search}
								onChange={(event) => {
									setPage(1);
									setSearch(event.target.value);
								}}
								placeholder="Search by site name or district"
								className="w-full rounded-md border border-stone-300 py-2 pl-9 pr-3 text-sm focus:border-stone-500 focus:outline-none"
							/>
						</div>

						<input
							value={stateFilter}
							onChange={(event) => {
								setPage(1);
								setStateFilter(event.target.value);
							}}
							placeholder="Filter by state"
							className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
						/>

						<select
							value={riskFilter}
							onChange={(event) => {
								setPage(1);
								setRiskFilter(event.target.value as RiskLevel | "");
							}}
							className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none">
							<option value="">All risk levels</option>
							{RISK_OPTIONS.map((option) => (
								<option key={option} value={option}>
									{option}
								</option>
							))}
						</select>

						<select
							value={protectionFilter}
							onChange={(event) => {
								setPage(1);
								setProtectionFilter(
									event.target.value as ProtectionStatus | "",
								);
							}}
							className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none">
							<option value="">All protection levels</option>
							{PROTECTION_OPTIONS.map((option) => (
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
						<table className="w-full min-w-225 border-collapse">
							<thead className="bg-stone-100 text-left text-xs uppercase tracking-wide text-stone-600">
								<tr>
									<th className="px-4 py-3">Site</th>
									<th className="px-4 py-3">Location</th>
									<th className="px-4 py-3">Protection</th>
									<th className="px-4 py-3">Risk</th>
									<th className="px-4 py-3">Capacity</th>
									<th className="px-4 py-3">Actions</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									<tr>
										<td
											colSpan={6}
											className="px-4 py-8 text-center text-sm text-stone-500">
											Loading sites...
										</td>
									</tr>
								) : null}

								{!loading && sites.length === 0 ? (
									<tr>
										<td
											colSpan={6}
											className="px-4 py-8 text-center text-sm text-stone-500">
											No sites found.
										</td>
									</tr>
								) : null}

								{!loading
									? sites.map((site) => (
											<tr
												key={site._id}
												className="border-t border-stone-200 text-sm">
												<td className="px-4 py-3">
													<p className="font-medium text-stone-900">
														{site.name}
													</p>
													<p className="text-xs text-stone-500">
														{site.description ||
															"No description"}
													</p>
												</td>
												<td className="px-4 py-3 text-stone-700">
													{site.district}, {site.state}
												</td>
												<td className="px-4 py-3 text-stone-700">
													{site.protectionStatus}
												</td>
												<td className="px-4 py-3 text-stone-700">
													{site.riskLevel}
												</td>
												<td className="px-4 py-3 text-stone-700">
													{site.visitorCapacity.toLocaleString()}
												</td>
												<td className="px-4 py-3">
													<div className="flex items-center gap-2">
														{!showArchived ? (
															<>
																{canManageSites ? (
																	<button
																		onClick={() =>
																			openEdit(
																				site,
																			)
																		}
																		className="inline-flex items-center gap-1 rounded-md border border-stone-300 px-2 py-1 text-xs text-stone-700 hover:bg-stone-100">
																		<SquarePen className="h-3.5 w-3.5" />
																		Edit
																	</button>
																) : null}
																{canArchiveSites ? (
																	<button
																		onClick={() =>
																			handleArchive(
																				site,
																			)
																		}
																		className="inline-flex items-center gap-1 rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50">
																		<Trash2 className="h-3.5 w-3.5" />
																		Archive
																	</button>
																) : null}
															</>
														) : canArchiveSites ? (
															<button
																onClick={() =>
																	handleRestore(
																		site,
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

			{showForm && canManageSites ? (
				<div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
					<div className="w-full max-w-2xl rounded-xl border border-stone-200 bg-white p-5 shadow-2xl">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-lg font-semibold">
								{editingSite ? "Edit Site" : "Create Site"}
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
								<input
									required
									value={formValues.name}
									onChange={(event) =>
										onFormChange("name", event.target.value)
									}
									placeholder="Site name"
									className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
								/>
								<input
									required
									value={formValues.state}
									onChange={(event) =>
										onFormChange("state", event.target.value)
									}
									placeholder="State"
									className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
								/>
								<input
									required
									value={formValues.district}
									onChange={(event) =>
										onFormChange("district", event.target.value)
									}
									placeholder="District"
									className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
								/>
								<input
									required
									type="number"
									value={formValues.visitorCapacity}
									onChange={(event) =>
										onFormChange(
											"visitorCapacity",
											event.target.value,
										)
									}
									placeholder="Visitor capacity"
									className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
								/>
								<input
									required
									type="number"
									step="any"
									value={formValues.longitude}
									onChange={(event) =>
										onFormChange("longitude", event.target.value)
									}
									placeholder="Longitude"
									className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
								/>
								<input
									required
									type="number"
									step="any"
									value={formValues.latitude}
									onChange={(event) =>
										onFormChange("latitude", event.target.value)
									}
									placeholder="Latitude"
									className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
								/>
								<select
									value={formValues.protectionStatus}
									onChange={(event) =>
										onFormChange(
											"protectionStatus",
											event.target.value as ProtectionStatus,
										)
									}
									className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none">
									{PROTECTION_OPTIONS.map((option) => (
										<option key={option} value={option}>
											{option}
										</option>
									))}
								</select>
								<select
									value={formValues.riskLevel}
									onChange={(event) =>
										onFormChange(
											"riskLevel",
											event.target.value as RiskLevel,
										)
									}
									className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none">
									{RISK_OPTIONS.map((option) => (
										<option key={option} value={option}>
											{option}
										</option>
									))}
								</select>
								<input
									type="date"
									value={formValues.lastInspectionDate}
									onChange={(event) =>
										onFormChange(
											"lastInspectionDate",
											event.target.value,
										)
									}
									className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
								/>
							</div>

							<textarea
								value={formValues.description}
								onChange={(event) =>
									onFormChange("description", event.target.value)
								}
								placeholder="Description"
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
										: editingSite
											? "Update Site"
											: "Create Site"}
								</button>
							</div>
						</form>
					</div>
				</div>
			) : null}
		</div>
	);
};

export default Sites;
