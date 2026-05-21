import { ConflictException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';

import { ProjectService } from './project.service';
import type { ProjectRepository, ProjectRow } from './project.types';

const CID = 'c0000000-0000-0000-0000-000000000001';
const PID = 'p0000000-0000-0000-0000-000000000001';

function makeRow(over: Partial<ProjectRow> = {}): ProjectRow {
  return {
    id: PID,
    sku: 'prj-ABCDEF01',
    name: 'Personal',
    color: '#1347ff',
    subscriptionsCount: 0,
    version: 1,
    ...over,
  };
}

function makeDeps() {
  const repo: jest.Mocked<ProjectRepository> = {
    listActive: jest.fn(),
    countActive: jest.fn(),
    findActiveById: jest.fn(),
    create: jest.fn(),
    rename: jest.fn(),
    hardDelete: jest.fn().mockResolvedValue(undefined),
  };
  const service = new ProjectService(repo);
  return { service, repo };
}

describe('ProjectService.list', () => {
  it('passes through to the repository', async () => {
    const { service, repo } = makeDeps();
    repo.listActive.mockResolvedValue([makeRow()]);

    const out = await service.list(CID);

    expect(repo.listActive).toHaveBeenCalledWith(CID);
    expect(out).toHaveLength(1);
  });
});

describe('ProjectService.create', () => {
  it('generates sku and color when not supplied', async () => {
    const { service, repo } = makeDeps();
    repo.create.mockImplementation(async (args) => makeRow({ name: args.name, color: args.color, sku: args.sku }));

    await service.create(CID, '  Family  ');

    expect(repo.create).toHaveBeenCalledTimes(1);
    const args = repo.create.mock.calls[0]![0];
    expect(args.customerId).toBe(CID);
    expect(args.name).toBe('Family'); // trimmed
    expect(args.sku).toMatch(/^prj-[0-9A-HJ-NP-TV-Z]{8}$/);
    expect(args.color).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('honors a valid client-supplied color', async () => {
    const { service, repo } = makeDeps();
    repo.create.mockImplementation(async (args) => makeRow({ color: args.color }));

    await service.create(CID, 'Work', '#abcdef');

    expect(repo.create.mock.calls[0]![0].color).toBe('#abcdef');
  });

  it('ignores a malformed color and falls back to a generated one', async () => {
    const { service, repo } = makeDeps();
    repo.create.mockImplementation(async (args) => makeRow({ color: args.color }));

    await service.create(CID, 'Work', 'not-a-hex');

    expect(repo.create.mock.calls[0]![0].color).toMatch(/^#[0-9a-f]{6}$/);
    expect(repo.create.mock.calls[0]![0].color).not.toBe('not-a-hex');
  });
});

describe('ProjectService.rename', () => {
  it('throws 404 when the project does not exist', async () => {
    const { service, repo } = makeDeps();
    repo.findActiveById.mockResolvedValue(null);

    await expect(service.rename(CID, PID, 'New name', 1)).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.rename).not.toHaveBeenCalled();
  });

  it('throws 409 when the version is stale', async () => {
    const { service, repo } = makeDeps();
    repo.findActiveById.mockResolvedValue(makeRow({ version: 3 }));
    repo.rename.mockResolvedValue(false);

    await expect(service.rename(CID, PID, 'New name', 2)).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns the updated row on success', async () => {
    const { service, repo } = makeDeps();
    repo.findActiveById
      .mockResolvedValueOnce(makeRow({ version: 1 }))
      .mockResolvedValueOnce(makeRow({ version: 2, name: 'Family' }));
    repo.rename.mockResolvedValue(true);

    const out = await service.rename(CID, PID, '  Family  ', 1);

    expect(repo.rename).toHaveBeenCalledWith({
      customerId: CID,
      projectId: PID,
      version: 1,
      name: 'Family', // trimmed
    });
    expect(out.name).toBe('Family');
    expect(out.version).toBe(2);
  });
});

describe('ProjectService.delete', () => {
  it('throws 404 when the project does not exist', async () => {
    const { service, repo } = makeDeps();
    repo.findActiveById.mockResolvedValue(null);

    await expect(service.delete(CID, PID)).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.hardDelete).not.toHaveBeenCalled();
  });

  it('refuses to delete the last active project (422)', async () => {
    const { service, repo } = makeDeps();
    repo.findActiveById.mockResolvedValue(makeRow());
    repo.countActive.mockResolvedValue(1);

    await expect(service.delete(CID, PID)).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(repo.hardDelete).not.toHaveBeenCalled();
  });

  it('cascades through the repository when more than one project remains', async () => {
    const { service, repo } = makeDeps();
    repo.findActiveById.mockResolvedValue(makeRow());
    repo.countActive.mockResolvedValue(2);

    await service.delete(CID, PID);

    expect(repo.hardDelete).toHaveBeenCalledWith(CID, PID);
  });
});
