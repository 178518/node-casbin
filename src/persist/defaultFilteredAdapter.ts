import { FilteredAdapter } from './filteredAdapter';
import { Model } from '../model';
import { FileAdapter } from './fileAdapter';
import { Adapter } from './adapter';
import { Helper } from './helper';
import { readFileSync } from 'fs';

export class Filter {
  public g: string[] = [];
  public p: string[] = [];
}

export class DefaultFilteredAdapter extends FileAdapter
  implements FilteredAdapter {
  private filtered: boolean;

  constructor(filePath: string) {
    super(filePath);
    this.filtered = false;
  }

  // loadPolicy loads all policy rules from the storage.
  public loadPolicy(model: Model): void {
    this.filtered = false;
    super.loadPolicy(model);
  }

  public loadFilteredPolicy(model: Model, filter: Filter): void {
    if (!filter) {
      this.loadPolicy(model);
      return;
    }

    if (!this.filePath) {
      throw new Error('invalid file path, file path cannot be empty');
    }

    this.loadFilteredPolicyFile(model, filter, Helper.loadPolicyLine);
    this.filtered = true;
  }

  private loadFilteredPolicyFile(model: Model, filter: Filter, handler: (line: string, model: Model) => void
  ) {
    const bodyBuf = readFileSync(this.filePath);
    const lines = bodyBuf.toString().split('\n');
    lines.forEach((n, index) => {
      const line = n.trim();
      if (!line || DefaultFilteredAdapter.filterLine(line, filter)) {
        return;
      }
      handler(line, model);
    });
  }

  public isFiltered(): boolean {
    return this.filtered;
  }

  public savePolicy(model: Model): void {
    if (this.filtered) {
      throw new Error('cannot save a filtered policy');
    }
    super.savePolicy(model);
  }

  private static filterLine(line: string, filter: Filter): boolean {
    if (!filter) {
      return false;
    }
    const p = line.split(',');
    if (p.length === 0) {
      return true;
    }
    let filterSlice: string[] = [];
    switch (p[0].trim()) {
      case 'p':
        filterSlice = filter.p;
        break;
      case 'g':
        filterSlice = filter.g;
        break;
    }

    return DefaultFilteredAdapter.filterWords(p, filterSlice);
  }

  private static filterWords(line: string[], filter: string[]): boolean {
    if (line.length < filter.length + 1) {
      return true;
    }
    let skipLine = false;
    for (let i = 0; i < filter.length; i++) {
      if (filter[i] && filter[i].trim() !== filter[i + 1].trim()) {
        skipLine = true;
        break;
      }
    }
    return skipLine;
  }
}
