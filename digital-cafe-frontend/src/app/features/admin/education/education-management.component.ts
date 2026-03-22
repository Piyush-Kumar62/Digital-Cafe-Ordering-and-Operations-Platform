import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from "rxjs";
import { HttpEventType, HttpResponse } from "@angular/common/http";
import { ApiService } from "@core/services/api.service";

type InstitutionRow = {
  id?: number;
  name: string;
  city?: string;
  state?: string;
};

type PageResponse<T> = {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isFirst?: boolean;
  isLast?: boolean;
};

type ImportResponse = {
  totalRows?: number;
  inserted?: number;
  skipped?: number;
  errors?: string[];
};

type EducationHealth = {
  institutionCount: number;
  degreeCount: number;
  branchCount: number;
  degreesMissingBranches: number;
  degreeNamesMissingBranches: string[];
};

type DuplicateReport = {
  institutionDuplicateGroups: number;
  degreeDuplicateGroups: number;
  branchDuplicateGroups: number;
  institutionSamples: Array<{ label: string; count: number }>;
  degreeSamples: Array<{ label: string; count: number }>;
  branchSamples: Array<{ label: string; count: number }>;
};

@Component({
  selector: "app-education-management",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./education-management.component.html",
  styleUrls: ["./education-management.component.scss"],
})
export class EducationManagementComponent implements OnInit, OnDestroy {
  search = "";
  page = 0;
  size = 20;
  totalPages = 0;
  totalElements = 0;
  loading = false;
  error = "";
  institutions: InstitutionRow[] = [];
  health: EducationHealth | null = null;
  healthLoading = false;
  healthError = "";

  institutionFile: File | null = null;
  degreeFile: File | null = null;
  branchFile: File | null = null;

  importingInstitutions = false;
  importingDegrees = false;
  importingBranches = false;

  importMessage = "";
  importErrors: string[] = [];
  importStatus = "";
  importJobId: number | null = null;
  importProgressLabel = "";
  jobHistory: Array<{
    id: number;
    importType: string;
    status: string;
    fileName?: string;
    insertedRows?: number;
    skippedRows?: number;
  }> = [];

  institutionUploadProgress = 0;
  degreeUploadProgress = 0;
  branchUploadProgress = 0;
  syncLoading = false;
  syncMessage = "";
  localFilename = "";
  localImportLoading = false;
  localImportMessage = "";
  duplicateLoading = false;
  duplicateReport: DuplicateReport | null = null;
  duplicateMessage = "";
  institutionPreview: string[][] = [];
  degreePreview: string[][] = [];
  branchPreview: string[][] = [];

  private readonly search$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term) => {
        this.page = 0;
        this.search = term;
        this.loadInstitutions();
      });

    this.loadInstitutions();
    this.loadEducationHealth();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(term: string): void {
    this.search$.next(term);
  }

  loadInstitutions(): void {
    this.loading = true;
    this.error = "";
    this.api
      .getAdminInstitutions(this.search, this.page, this.size)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.institutions = res.content || [];
          this.totalPages = res.totalPages || 0;
          this.totalElements = res.totalElements || 0;
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.message || "Unable to load institutions.";
        },
      });
  }

  loadEducationHealth(): void {
    this.healthLoading = true;
    this.healthError = "";
    this.api.getEducationHealth().subscribe({
      next: (res) => {
        this.healthLoading = false;
        this.health = res;
      },
      error: (err) => {
        this.healthLoading = false;
        this.healthError = err?.error?.message || "Unable to load education health.";
      },
    });
  }

  syncInstitutionsFromDataGov(): void {
    this.syncLoading = true;
    this.syncMessage = "";
    this.api.syncEducationInstitutions().subscribe({
      next: (res) => {
        this.syncLoading = false;
        this.syncMessage = `Sync complete. Fetched ${res.totalFetched}, inserted ${res.inserted}, skipped ${res.skipped}.`;
        this.loadEducationHealth();
        this.loadInstitutions();
      },
      error: (err) => {
        this.syncLoading = false;
        this.syncMessage = err?.error?.message || "Sync failed. Check API key/resource id.";
      },
    });
  }

  importLocalFile(): void {
    if (!this.localFilename.trim()) return;
    this.localImportLoading = true;
    this.localImportMessage = "";
    this.api.importLocalEducationFile(this.localFilename.trim(), "INSTITUTIONS").subscribe({
      next: (job) => {
        this.localImportLoading = false;
        this.localImportMessage = `Local import queued: ${job.fileName || this.localFilename}`;
        if (job?.id) {
          this.pollImportJob(job.id, "Local");
        }
      },
      error: (err) => {
        this.localImportLoading = false;
        this.localImportMessage = err?.error?.message || "Local import failed.";
      },
    });
  }

  runDuplicateCheck(): void {
    this.duplicateLoading = true;
    this.duplicateMessage = "";
    this.api.getEducationDuplicateReport().subscribe({
      next: (res) => {
        this.duplicateLoading = false;
        this.duplicateReport = res;
      },
      error: (err) => {
        this.duplicateLoading = false;
        this.duplicateMessage = err?.error?.message || "Duplicate check failed.";
      },
    });
  }

  prevPage(): void {
    if (this.page <= 0) return;
    this.page -= 1;
    this.loadInstitutions();
  }

  nextPage(): void {
    if (this.page + 1 >= this.totalPages) return;
    this.page += 1;
    this.loadInstitutions();
  }

  onInstitutionFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement)?.files?.[0] || null;
    this.institutionFile = file;
    if (file) {
      this.validateCsvPreview(file, "institution");
      this.loadCsvPreview(file, "institution");
    }
  }

  onDegreeFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement)?.files?.[0] || null;
    this.degreeFile = file;
    if (file) {
      this.validateCsvPreview(file, "degree");
      this.loadCsvPreview(file, "degree");
    }
  }

  onBranchFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement)?.files?.[0] || null;
    this.branchFile = file;
    if (file) {
      this.validateCsvPreview(file, "branch");
      this.loadCsvPreview(file, "branch");
    }
  }

  importInstitutions(): void {
    if (!this.institutionFile) return;
    this.importingInstitutions = true;
    this.importMessage = "";
    this.importErrors = [];
    this.importStatus = "Uploading institutions CSV...";
    this.institutionUploadProgress = 0;

    this.api.importInstitutionsAdminProgress(this.institutionFile).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          const total = event.total || 1;
          this.institutionUploadProgress = Math.round(
            (event.loaded / total) * 100,
          );
          this.importProgressLabel = `${this.institutionUploadProgress}% uploaded`;
        }
        if (event instanceof HttpResponse) {
          const job = event.body?.data || event.body || {};
          this.importingInstitutions = false;
          this.importJobId = Number(job.id || 0) || null;
          this.importStatus = "Import queued. Processing in background...";
          if (this.importJobId) {
            this.pollImportJob(this.importJobId, "Institutions");
          }
        }
      },
      error: (err) => {
        this.importingInstitutions = false;
        this.importMessage =
          err?.error?.message || "Institution import failed.";
      },
    });
  }

  importDegrees(): void {
    if (!this.degreeFile) return;
    this.importingDegrees = true;
    this.importMessage = "";
    this.importErrors = [];
    this.importStatus = "Uploading degrees CSV...";
    this.degreeUploadProgress = 0;

    this.api.importDegreesAdminProgress(this.degreeFile).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          const total = event.total || 1;
          this.degreeUploadProgress = Math.round(
            (event.loaded / total) * 100,
          );
          this.importProgressLabel = `${this.degreeUploadProgress}% uploaded`;
        }
        if (event instanceof HttpResponse) {
          const job = event.body?.data || event.body || {};
          this.importingDegrees = false;
          this.importJobId = Number(job.id || 0) || null;
          this.importStatus = "Import queued. Processing in background...";
          if (this.importJobId) {
            this.pollImportJob(this.importJobId, "Degrees");
          }
        }
      },
      error: (err) => {
        this.importingDegrees = false;
        this.importMessage = err?.error?.message || "Degree import failed.";
      },
    });
  }

  importBranches(): void {
    if (!this.branchFile) return;
    this.importingBranches = true;
    this.importMessage = "";
    this.importErrors = [];
    this.importStatus = "Uploading branches CSV...";
    this.branchUploadProgress = 0;

    this.api.importBranchesAdminProgress(this.branchFile).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          const total = event.total || 1;
          this.branchUploadProgress = Math.round(
            (event.loaded / total) * 100,
          );
          this.importProgressLabel = `${this.branchUploadProgress}% uploaded`;
        }
        if (event instanceof HttpResponse) {
          const job = event.body?.data || event.body || {};
          this.importingBranches = false;
          this.importJobId = Number(job.id || 0) || null;
          this.importStatus = "Import queued. Processing in background...";
          if (this.importJobId) {
            this.pollImportJob(this.importJobId, "Branches");
          }
        }
      },
      error: (err) => {
        this.importingBranches = false;
        this.importMessage = err?.error?.message || "Branch import failed.";
      },
    });
  }

  private setImportSummary(label: string, res: ImportResponse): void {
    this.importMessage = `${label} import complete. Inserted ${
      res.inserted ?? 0
    }, skipped ${res.skipped ?? 0}.`;
    this.importErrors = res.errors || [];
  }

  private pollImportJob(jobId: number, label: string): void {
    this.api.getImportJobStatus(jobId).subscribe({
      next: (job) => {
        const status = String(job.status || "").toUpperCase();
        if (status === "COMPLETED") {
          this.importStatus = `${label} import completed.`;
          this.importProgressLabel = "";
          this.importMessage = `${label} import complete. Inserted ${
            job.insertedRows ?? 0
          }, skipped ${job.skippedRows ?? 0}.`;
          this.importErrors = job.errors || [];
          this.pushJobHistory(job);
          this.loadEducationHealth();
          if (label === "Institutions") {
            this.loadInstitutions();
          }
          return;
        }
        if (status === "FAILED") {
          this.importStatus = `${label} import failed.`;
          this.importProgressLabel = "";
          this.importMessage =
            job.errorMessage || `${label} import failed.`;
          this.importErrors = job.errors || [];
          this.pushJobHistory(job);
          return;
        }

        this.importStatus = `${label} import running...`;
        this.importProgressLabel = "";
        setTimeout(() => this.pollImportJob(jobId, label), 2000);
      },
      error: () => {
        this.importStatus = `${label} import status unavailable.`;
      },
    });
  }

  downloadInstitutionTemplate(): void {
    const content = "name,city,state\n";
    this.downloadCsv("institutions-template.csv", content);
  }

  downloadDegreeTemplate(): void {
    const content = "degree\nB.Tech\nMBA\n";
    this.downloadCsv("degrees-template.csv", content);
  }

  downloadBranchTemplate(): void {
    const content = "degree,branch\nB.Tech,Computer Science and Engineering\nMBA,Finance\n";
    this.downloadCsv("branches-template.csv", content);
  }

  private downloadCsv(filename: string, content: string): void {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  private pushJobHistory(job: any): void {
    if (!job?.id) return;
    const existing = this.jobHistory.find((j) => j.id === job.id);
    if (existing) {
      Object.assign(existing, {
        status: job.status,
        fileName: job.fileName,
        insertedRows: job.insertedRows,
        skippedRows: job.skippedRows,
        importType: job.importType,
      });
      return;
    }
    this.jobHistory = [
      {
        id: job.id,
        importType: job.importType || "",
        status: job.status || "",
        fileName: job.fileName,
        insertedRows: job.insertedRows,
        skippedRows: job.skippedRows,
      },
      ...this.jobHistory,
    ].slice(0, 10);
  }

  private validateCsvPreview(file: File, type: "institution" | "degree" | "branch"): void {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const firstLine = text.split(/\r?\n/).find((line) => line.trim().length > 0);
      if (!firstLine) return;
      const lower = firstLine.toLowerCase();
      let valid = false;
      if (type === "institution") {
        valid = lower.includes("name") && lower.includes("city");
      } else if (type === "degree") {
        valid = lower.includes("degree");
      } else {
        valid = lower.includes("degree") && lower.includes("branch");
      }
      if (!valid) {
        this.importMessage =
          "CSV header doesn't look correct. Please use the template format.";
      }
    };
    reader.readAsText(file);
  }

  private loadCsvPreview(file: File, type: "institution" | "degree" | "branch"): void {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0).slice(0, 6);
      const rows = lines.map((line) => this.parseCsvLine(line));
      if (type === "institution") this.institutionPreview = rows;
      if (type === "degree") this.degreePreview = rows;
      if (type === "branch") this.branchPreview = rows;
    };
    reader.readAsText(file);
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += c;
      }
    }
    result.push(current);
    return result;
  }
}
