/**
 * The upload state shared by `UploadArea` and a Button in its progress state
 * (SPEC.md §5).
 *
 * One class, two presentations. A dropzone and a button that uploads are the
 * same state machine wearing different clothes, and building them separately is
 * how the two end up disagreeing about what "uploading" means.
 *
 * It deliberately does **not** perform the upload. Transport is the application's
 * business — `fetch`, XHR with progress events, a resumable client, a queue —
 * and a component that picks one for you is a component you fight. This owns
 * selection, validation, progress bookkeeping and status; the caller owns the
 * network.
 */

export type UploadStatus = 'idle' | 'uploading' | 'complete' | 'error';

export interface UploadItem {
	/** Stable across the item's life, so a list can key on it. */
	id: string;
	file: File;
	/** 0–1. */
	progress: number;
	status: UploadStatus;
	/** Set when `status` is `error`. Shown to the user, so write it in German. */
	error?: string;
}

export interface UploadOptions {
	/** Bytes. Files over this are rejected on arrival with an error item. */
	maxSize?: number;
	/** Accept string, matched against the file's type and extension. */
	accept?: string;
	multiple?: boolean;
	/** Called for each file that passes validation. */
	onAdd?: (item: UploadItem) => void;
	onRemove?: (item: UploadItem) => void;
}

const FORMAT_BYTES = new Intl.NumberFormat('de-AT', { maximumFractionDigits: 1 });

/** Human-readable size, in the project's locale (§1.2). */
export function formatBytes(bytes: number): string {
	const units = ['B', 'kB', 'MB', 'GB'];
	let value = bytes;
	let unit = 0;
	while (value >= 1024 && unit < units.length - 1) {
		value /= 1024;
		unit += 1;
	}
	return `${FORMAT_BYTES.format(value)} ${units[unit]}`;
}

/**
 * Whether a file matches an `accept` string.
 *
 * Written out rather than delegated to the input's own filtering because the
 * drop path never goes through an `<input>` — a browser will happily drop a
 * `.exe` onto a zone whose input says `accept="image/*"`. Validating in one
 * place means the two paths cannot disagree.
 */
export function matchesAccept(file: File, accept: string | undefined): boolean {
	if (!accept) return true;
	const name = file.name.toLowerCase();
	return accept
		.split(',')
		.map((entry) => entry.trim().toLowerCase())
		.filter(Boolean)
		.some((entry) => {
			if (entry.startsWith('.')) return name.endsWith(entry);
			if (entry.endsWith('/*')) return file.type.startsWith(entry.slice(0, -1));
			return file.type === entry;
		});
}

export class UploadState {
	#items: UploadItem[] = $state([]);
	#options: UploadOptions;
	#counter = 0;

	constructor(options: UploadOptions = {}) {
		this.#options = options;
	}

	get items(): UploadItem[] {
		return this.#items;
	}

	/** `uploading` while any item is; `error` if any failed; otherwise the quietest truth. */
	get status(): UploadStatus {
		if (this.#items.some((item) => item.status === 'uploading')) return 'uploading';
		if (this.#items.some((item) => item.status === 'error')) return 'error';
		if (this.#items.length > 0 && this.#items.every((item) => item.status === 'complete')) {
			return 'complete';
		}
		return 'idle';
	}

	/**
	 * Mean progress across every item, 0–1.
	 *
	 * Mean rather than bytes-weighted on purpose: a progress bar that stalls at 4%
	 * while one large file uploads, having "finished" nine small ones, tells the
	 * user less than one that moves steadily. Weighted is more accurate and less
	 * informative.
	 */
	get progress(): number {
		if (this.#items.length === 0) return 0;
		return this.#items.reduce((total, item) => total + item.progress, 0) / this.#items.length;
	}

	/** Adds files, rejecting the ones that fail validation as `error` items. */
	add(files: Iterable<File>): UploadItem[] {
		const incoming = [...files];
		const accepted: UploadItem[] = [];

		for (const file of incoming) {
			const id = `upload-${(this.#counter += 1)}`;
			let error: string | undefined;

			if (!matchesAccept(file, this.#options.accept)) {
				error = 'Dateityp nicht erlaubt';
			} else if (this.#options.maxSize !== undefined && file.size > this.#options.maxSize) {
				error = `Datei zu groß — höchstens ${formatBytes(this.#options.maxSize)}`;
			}

			const item: UploadItem = {
				id,
				file,
				progress: 0,
				status: error ? 'error' : 'idle',
				error
			};

			// A rejected file still becomes an item. Silently dropping it leaves the
			// user watching nothing happen and wondering which file was the problem.
			if (this.#options.multiple === false) this.#items = [item];
			else this.#items = [...this.#items, item];

			if (!error) {
				accepted.push(item);
				this.#options.onAdd?.(item);
			}
		}

		return accepted;
	}

	/** Called by the application as its transport reports progress. */
	setProgress(id: string, progress: number): void {
		this.#update(id, (item) => {
			item.progress = Math.min(1, Math.max(0, progress));
			item.status = item.progress >= 1 ? 'complete' : 'uploading';
		});
	}

	fail(id: string, message: string): void {
		this.#update(id, (item) => {
			item.status = 'error';
			item.error = message;
		});
	}

	remove(id: string): void {
		const item = this.#items.find((candidate) => candidate.id === id);
		if (!item) return;
		this.#items = this.#items.filter((candidate) => candidate.id !== id);
		this.#options.onRemove?.(item);
	}

	clear(): void {
		this.#items = [];
	}

	#update(id: string, mutate: (item: UploadItem) => void): void {
		this.#items = this.#items.map((item) => {
			if (item.id !== id) return item;
			const next = { ...item };
			mutate(next);
			return next;
		});
	}
}
