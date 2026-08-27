import { describe, expect, it } from 'vitest';
import { UploadState, formatBytes, matchesAccept } from './upload.svelte.js';

const file = (name: string, size = 100, type = 'text/plain') =>
	new File(['x'.repeat(size)], name, { type });

describe('matchesAccept', () => {
	it('accepts everything when no accept is given', () => {
		expect(matchesAccept(file('a.txt'), undefined)).toBe(true);
	});

	it('matches an extension', () => {
		expect(matchesAccept(file('a.PDF'), '.pdf')).toBe(true);
		expect(matchesAccept(file('a.txt'), '.pdf')).toBe(false);
	});

	it('matches a wildcard type', () => {
		expect(matchesAccept(file('a.png', 1, 'image/png'), 'image/*')).toBe(true);
		expect(matchesAccept(file('a.txt'), 'image/*')).toBe(false);
	});

	it('matches an exact type, and any entry in a list', () => {
		expect(matchesAccept(file('a.txt'), 'text/plain')).toBe(true);
		expect(matchesAccept(file('a.txt'), 'image/*, text/plain')).toBe(true);
	});

	/*
	 * The reason this is written out rather than delegated to the input: a browser
	 * will happily *drop* a file onto a zone whose input says `accept="image/*"`.
	 * The drop path never goes through the input, so validating in one place is
	 * what stops the two paths disagreeing.
	 */
	it('is what the drop path uses, since the input never sees it', () => {
		expect(matchesAccept(file('virus.exe', 1, 'application/x-msdownload'), 'image/*')).toBe(false);
	});
});

describe('validation produces visible items, not silence', () => {
	it('keeps a rejected file as an error item', () => {
		const upload = new UploadState({ accept: 'image/*' });
		const accepted = upload.add([file('notes.txt')]);
		expect(accepted).toHaveLength(0);
		// Silently dropping it leaves the user watching nothing happen and
		// wondering which file was the problem.
		expect(upload.items).toHaveLength(1);
		expect(upload.items[0].status).toBe('error');
		expect(upload.items[0].error).toContain('Dateityp');
	});

	it('rejects a file over maxSize with the limit in the message', () => {
		const upload = new UploadState({ maxSize: 50 });
		upload.add([file('big.txt', 100)]);
		expect(upload.items[0].status).toBe('error');
		expect(upload.items[0].error).toContain('zu groß');
	});

	it('replaces rather than appends when multiple is false', () => {
		const upload = new UploadState({ multiple: false });
		upload.add([file('a.txt')]);
		upload.add([file('b.txt')]);
		expect(upload.items).toHaveLength(1);
		expect(upload.items[0].file.name).toBe('b.txt');
	});
});

describe('aggregate status is the quietest true statement', () => {
	it('is idle with nothing, and idle with only untouched items', () => {
		const upload = new UploadState();
		expect(upload.status).toBe('idle');
		upload.add([file('a.txt')]);
		expect(upload.status).toBe('idle');
	});

	it('is uploading while any item is', () => {
		const upload = new UploadState();
		const [item] = upload.add([file('a.txt'), file('b.txt')]);
		upload.setProgress(item.id, 0.5);
		expect(upload.status).toBe('uploading');
	});

	it('is error if any item failed, even when others are uploading', () => {
		const upload = new UploadState();
		const [a, b] = upload.add([file('a.txt'), file('b.txt')]);
		upload.setProgress(a.id, 1);
		upload.fail(b.id, 'Netzwerkfehler');
		expect(upload.status).toBe('error');
	});

	it('is complete only when every item is', () => {
		const upload = new UploadState();
		const items = upload.add([file('a.txt'), file('b.txt')]);
		upload.setProgress(items[0].id, 1);
		expect(upload.status).not.toBe('complete');
		upload.setProgress(items[1].id, 1);
		expect(upload.status).toBe('complete');
	});
});

describe('progress', () => {
	it('is the mean, not bytes-weighted', () => {
		const upload = new UploadState();
		const items = upload.add([file('small.txt', 1), file('large.txt', 10_000)]);
		upload.setProgress(items[0].id, 1);
		upload.setProgress(items[1].id, 0);
		// Bytes-weighted this would read ~0.0001 and appear stuck. The mean moves,
		// which tells the user more even though it is less accurate.
		expect(upload.progress).toBeCloseTo(0.5, 6);
	});

	it('clamps out-of-range reports from the caller', () => {
		const upload = new UploadState();
		const [item] = upload.add([file('a.txt')]);
		upload.setProgress(item.id, 5);
		expect(upload.items[0].progress).toBe(1);
		upload.setProgress(item.id, -1);
		expect(upload.items[0].progress).toBe(0);
	});

	it('flips to complete on its own at 1', () => {
		const upload = new UploadState();
		const [item] = upload.add([file('a.txt')]);
		upload.setProgress(item.id, 1);
		expect(upload.items[0].status).toBe('complete');
	});
});

describe('removal', () => {
	it('removes by id and calls back', () => {
		let removed = '';
		const upload = new UploadState({ onRemove: (item) => (removed = item.file.name) });
		const [item] = upload.add([file('a.txt')]);
		upload.remove(item.id);
		expect(upload.items).toHaveLength(0);
		expect(removed).toBe('a.txt');
	});

	it('ignores an unknown id rather than throwing', () => {
		const upload = new UploadState();
		upload.add([file('a.txt')]);
		upload.remove('nope');
		expect(upload.items).toHaveLength(1);
	});

	it('gives every item a distinct id, including same-named files', () => {
		const upload = new UploadState();
		upload.add([file('a.txt'), file('a.txt'), file('a.txt')]);
		expect(new Set(upload.items.map((item) => item.id)).size).toBe(3);
	});
});

describe('formatBytes', () => {
	it.each([
		[512, 'B'],
		[2048, 'kB'],
		[5 * 1024 * 1024, 'MB'],
		[3 * 1024 ** 3, 'GB']
	])('scales %i to %s', (bytes, unit) => {
		expect(formatBytes(bytes)).toContain(unit);
	});
});
