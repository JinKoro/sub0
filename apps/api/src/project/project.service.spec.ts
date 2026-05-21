import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

import { ProjectService } from './project.service';
import type { ProjectRepository, ProjectRow } from './project.types';

const CID = 'c0000000-0000-0000-0000-000000000001';
const SKU = 'prj-ABCDEF01';

function makeRow(over: Partial<ProjectRow> = {}): ProjectRow {
  return {
    id: 'p0000000-0000-0000-0000-000000000001',
    sku: SKU,
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
    findActiveBySku: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
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
    repo.create.mockImplementation(async (args) =>
      makeRow({ name: args.name, color: args.color, sku: args.sku }),
    );

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

describe('ProjectService.update', () => {
  it('throws 400 with an empty patch', async () => {
    const { service, repo } = makeDeps();
    await expect(service.update(CID, SKU, {}, 1)).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.findActiveBySku).not.toHaveBeenCalled();
  });

  it('throws 400 on a malformed color', async () => {
    const { service } = makeDeps();
    await expect(service.update(CID, SKU, { color: 'not-hex' }, 1)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws 404 when the project does not exist', async () => {
    const { service, repo } = makeDeps();
    repo.findActiveBySku.mockResolvedValue(null);

    await expect(service.update(CID, SKU, { name: 'New' }, 1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('throws 409 when the version is stale', async () => {
    const { service, repo } = makeDeps();
    repo.findActiveBySku.mockResolvedValue(makeRow({ version: 3 }));
    repo.update.mockResolvedValue(false);

    await expect(service.update(CID, SKU, { name: 'New' }, 2)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('updates name and color together', async () => {
    const { service, repo } = makeDeps();
    repo.findActiveBySku
      .mockResolvedValueOnce(makeRow({ version: 1 }))
      .mockResolvedValueOnce(makeRow({ version: 2, name: 'Family', color: '#abcdef' }));
    repo.update.mockResolvedValue(true);

    const out = await service.update(CID, SKU, { name: '  Family  ', color: '#abcdef' }, 1);

    expect(repo.update).toHaveBeenCalledWith({
      customerId: CID,
      sku: SKU,
      version: 1,
      patch: { name: 'Family', color: '#abcdef' }, // trimmed name, normalized color
    });
    expect(out.name).toBe('Family');
    expect(out.color).toBe('#abcdef');
    expect(out.version).toBe(2);
  });

  it('updates only color when name is omitted', async () => {
    const { service, repo } = makeDeps();
    repo.findActiveBySku
      .mockResolvedValueOnce(makeRow({ version: 1 }))
      .mockResolvedValueOnce(makeRow({ version: 2, color: '#abcdef' }));
    repo.update.mockResolvedValue(true);

    await service.update(CID, SKU, { color: '#abcdef' }, 1);

    expect(repo.update.mock.calls[0]![0].patch).toEqual({ color: '#abcdef' });
  });
});

describe('ProjectService.delete', () => {
  it('throws 404 when the project does not exist', async () => {
    const { service, repo } = makeDeps();
    repo.findActiveBySku.mockResolvedValue(null);

    await expect(service.delete(CID, SKU)).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.hardDelete).not.toHaveBeenCalled();
  });

  it('refuses to delete the last active project (422)', async () => {
    const { service, repo } = makeDeps();
    repo.findActiveBySku.mockResolvedValue(makeRow());
    repo.countActive.mockResolvedValue(1);

    await expect(service.delete(CID, SKU)).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(repo.hardDelete).not.toHaveBeenCalled();
  });

  it('cascades through the repository when more than one project remains', async () => {
    const { service, repo } = makeDeps();
    repo.findActiveBySku.mockResolvedValue(makeRow());
    repo.countActive.mockResolvedValue(2);

    await service.delete(CID, SKU);

    expect(repo.hardDelete).toHaveBeenCalledWith(CID, SKU);
  });
});
