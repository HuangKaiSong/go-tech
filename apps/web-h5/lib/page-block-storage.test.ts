import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import {
  getPageBlockDirectory,
  initializePageBlockDirectory,
  preparePageBlockDirectory
} from './page-block-directory.cjs';
import { isValidPageBlockKey, readPageBlockFile, writePageBlockFile } from './page-block-storage';

test('page blocks survive saves, restarts and changed release defaults', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'h5-page-blocks-'));
  const previousDirectory = process.env.H5_PAGE_BLOCKS_DIR;
  try {
    const runtime = path.join(root, 'runtime');
    const defaults = path.join(root, 'defaults');
    const directory = path.join(root, 'persistent');
    await Promise.all([mkdir(runtime), mkdir(defaults)]);
    const oldBlocks = { pages: { home: [{ id: 'saved-in-admin' }] } };
    await writeFile(path.join(runtime, 'home.json'), JSON.stringify(oldBlocks));
    await writeFile(path.join(defaults, 'home.json'), JSON.stringify({ pages: { home: [] } }));
    await writeFile(path.join(defaults, 'common.json'), JSON.stringify({ pages: { common: [] } }));
    process.env.H5_PAGE_BLOCKS_DIR = directory;

    initializePageBlockDirectory(directory, [runtime, defaults]);
    assert.equal(getPageBlockDirectory(), directory);
    assert.deepEqual(await readPageBlockFile('home'), oldBlocks);
    assert.deepEqual(await readPageBlockFile('common'), { pages: { common: [] } });

    const blocks = [{ id: 'home-section', title: 'New title' }];
    await writePageBlockFile('home', blocks);
    initializePageBlockDirectory(directory, [runtime, defaults]);
    const saved = await readPageBlockFile('home');
    assert.deepEqual((saved as { pages: { home: unknown[] } }).pages.home, blocks);
    const files = await readdir(directory);
    assert.ok(files.includes('common.json') && files.includes('home.json'));
    assert.ok(files.every(file => file.endsWith('.json')));
    assert.deepEqual(JSON.parse(await readFile(path.join(runtime, 'home.json'), 'utf-8')), oldBlocks);

    await Promise.all(
      ['../home', '/tmp/home', '', 'home.json', 'home/other'].map(async key => {
        assert.equal(isValidPageBlockKey(key), false);
        await assert.rejects(writePageBlockFile(key, []), /Invalid page block key/);
      })
    );
    assert.equal(isValidPageBlockKey('core-advantages'), true);
    process.env.H5_PAGE_BLOCKS_DIR = 'relative/path';
    assert.throws(getPageBlockDirectory, /absolute path/);
  } finally {
    if (previousDirectory === undefined) delete process.env.H5_PAGE_BLOCKS_DIR;
    else process.env.H5_PAGE_BLOCKS_DIR = previousDirectory;
    await rm(root, { recursive: true, force: true });
  }
});

test('build preparation migrates standalone edits before the old build is removed', async () => {
  const appRoot = await mkdtemp(path.join(os.tmpdir(), 'h5-block-migration-'));
  const previousDirectory = process.env.H5_PAGE_BLOCKS_DIR;
  try {
    delete process.env.H5_PAGE_BLOCKS_DIR;
    const runtime = path.join(appRoot, '.next/standalone/apps/web-h5/public/page-blocks');
    await mkdir(runtime, { recursive: true });
    await writeFile(path.join(runtime, 'home.json'), JSON.stringify({ pages: { home: [{ id: 'admin-edit' }] } }));
    preparePageBlockDirectory(appRoot);
    assert.equal(getPageBlockDirectory(), path.join(appRoot, 'data/page-blocks'));
    await rm(path.join(appRoot, '.next'), { recursive: true });
    preparePageBlockDirectory(appRoot);
    assert.deepEqual(await readPageBlockFile('home'), { pages: { home: [{ id: 'admin-edit' }] } });
  } finally {
    if (previousDirectory === undefined) delete process.env.H5_PAGE_BLOCKS_DIR;
    else process.env.H5_PAGE_BLOCKS_DIR = previousDirectory;
    await rm(appRoot, { recursive: true, force: true });
  }
});
