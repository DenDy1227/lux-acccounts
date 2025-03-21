import {ChangeDetectorRef, Component, DestroyRef, HostListener, inject, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Params, Router, RouterOutlet} from '@angular/router';
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatIconModule} from "@angular/material/icon";
import {MatInput} from "@angular/material/input";
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {filter, map, Observable, of, startWith, take, tap, throttleTime} from "rxjs";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
  MatOption
} from "@angular/material/autocomplete";
import {CommonModule} from "@angular/common";
import {MatFabButton, MatIconButton} from "@angular/material/button";
import {ACCOUNTS} from "./source/accounts";
import {MatTableDataSource, MatTableModule} from "@angular/material/table";
import {accTransformed} from "./source/thransformedAccounts";
import {GetClassColorPipe} from "./utils/get-class-color.pipe";
import {MatPaginator, MatPaginatorModule} from "@angular/material/paginator";
import { FileService } from './service/downloadService';

import {HttpClientModule} from "@angular/common/http";

import {ACCOUNTS_F} from "./source/flatSource";

const FIELD_NAMES = {
  CLASS_DESCRIPTION: 'classDescription',
  CLASS_NUMBER: 'classNumber',
  SUBCLASS_DESCRIPTION: 'subclassDescription',
  SUBCLASS_NUMBER: 'subclassNumber',
  DESCRIPTION: 'description',
  ACCOUNT_NUMBER: 'accountNumber',

} as const

interface Option {
  value: string;
  label: string;
}

interface FlattenedData {
  classNumber: string;
  classDescription: { en: string; fr: string };
  subclassNumber: string | undefined;
  subclassDescription: { en: string; fr: string };
  accountNumber: string | undefined;
  accountDescription: { en: string; fr: string } | undefined;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HttpClientModule,RouterOutlet, MatTableModule, CommonModule, MatFormFieldModule, MatIconModule, MatInput, ReactiveFormsModule, MatAutocomplete, MatAutocompleteTrigger, MatOption, MatIconButton, GetClassColorPipe, MatFabButton],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers:[FileService]
})
export class AppComponent implements OnInit {
  public accountsFilterForm: FormGroup;
  public formControlName = FIELD_NAMES;

  classControl = new FormControl('');
  searchControl = new FormControl('');
  subClassControl = new FormControl('');
  accControl = new FormControl('');

  public storedV = accTransformed;
  classOptions: { value: string, label: string }[] = this.getClassOptions();
  subclassOptions: { value: string, label: string }[] = this.getSubclassOptions();

  filteredClassOptions!: Observable<{ value: string, label: string }[]>;
  filteredSubClassOptions!: Observable<{ value: string, label: string }[]>;
  filteredSearchResults!: Observable<string[]>;

  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  filteredTableData: FlattenedData[] = [];
  // flattenedDataSource:FlattenedData[] = [];
  flattenedTableDataSource = new MatTableDataSource<FlattenedData,MatPaginator>([]);
  displayedColumns: string[] = [
    'classNumber',
    'classDescription',
    'subclassNumber',
    'subclassDescription',
    'accountNumber',
    'accountDescription'
  ];
  dataSource = ACCOUNTS;


  showScrollButton = false; // Controls when the button appears

  @HostListener('window:scroll', [])
  onWindowScroll() {
    // Show button when scrolled down 300px
    this.showScrollButton = window.scrollY > 300;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private fileService: FileService) {
    this.accountsFilterForm = this.fb.group({
      [FIELD_NAMES.CLASS_DESCRIPTION]: [null],
      [FIELD_NAMES.SUBCLASS_DESCRIPTION]: [null],
      [FIELD_NAMES.DESCRIPTION]: [null],
      [FIELD_NAMES.ACCOUNT_NUMBER]: [null],
      [FIELD_NAMES.CLASS_NUMBER]: [null],
      [FIELD_NAMES.SUBCLASS_NUMBER]: [null],
    });
  }

  ngOnInit(): void {
    this.initializeFilters();
    this.initializeAutocomplete();
    this.loadData();

    this.filteredClassOptions = this.classControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(this.classOptions, value))
    );

    this.filteredSubClassOptions = this.subClassControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(this.subclassOptions, value))
    );

    // 🔹 Class Control Filter
    this.classControl?.valueChanges.subscribe((searchedString: string | Option | null) => {
      const searchParam = typeof searchedString === 'object'
        ? (searchedString as Option)?.label
        : searchedString;

      this.updateFilter({ class: searchParam });
    });

    // 🔹 Subclass Control Filter
    this.subClassControl?.valueChanges.subscribe((searchedString: string | Option | null) => {
      const searchParam = typeof searchedString === 'object'
        ? (searchedString as Option)?.label
        : searchedString;

      this.updateFilter({ subClass: searchParam });
    });

    // 🔹 Custom Filter Predicate for Accurate Filtering
    this.flattenedTableDataSource.filterPredicate = (data: FlattenedData, filter: string): boolean => {
      let searchTerms;

      // ✅ Safe JSON Parsing
      try {
        searchTerms = JSON.parse(filter);
      } catch (error) {
        console.error('Invalid JSON filter:', filter);
        return true; // Show all data if JSON is invalid
      }

      // ✅ Handle Empty Filters — Show All Data
      if (!searchTerms.class && !searchTerms.subClass && !searchTerms.acc) {
        return true;
      }

      // 🔹 Filter Conditions
      const classMatch =
        !searchTerms.class || data.classDescription.en.toLowerCase().includes(searchTerms.class.toLowerCase()) ||
        data.classDescription.fr.toLowerCase().includes(searchTerms.class.toLowerCase());

      const subClassMatch =
        !searchTerms.subClass || data.subclassDescription.en.toLowerCase().includes(searchTerms.subClass.toLowerCase()) ||
        data.subclassDescription.fr.toLowerCase().includes(searchTerms.subClass.toLowerCase());

      const accMatch =
        !searchTerms.acc || data.accountDescription?.en?.toLowerCase().includes(searchTerms.acc.toLowerCase()) ||
        data.accountDescription?.fr?.toLowerCase().includes(searchTerms.acc.toLowerCase());

      return Boolean(classMatch && subClassMatch && accMatch);
    };

    // 🔹 Account Control Filter (Throttle to Reduce Unnecessary Requests)
    this.accControl?.valueChanges.pipe(throttleTime(600)).subscribe((accName) => {
      this.updateFilter({ acc: accName ?? '' });
    });
  }


  /** ============================
   * 🔹 Unified Filter Logic
   * ============================ */
  initializeFilters(): void {
    const filterControls = [
      { control: this.classControl, key: 'classDescription' },
      { control: this.subClassControl, key: 'subclassDescription' },
      { control: this.accControl, key: 'accountDescription' }
    ];

    filterControls.forEach(({ control, key }) => {
      control?.valueChanges.subscribe((searchedString: Option | string | null) => {
        const searchParam = typeof searchedString === 'object' ? (searchedString as Option)?.label : searchedString;
        if (!searchParam) {
          // this.flattenData();  // Restore the original data
          return;
        }

        this.updateFilter({ [key]: searchParam });
      });
    });

    this.flattenedTableDataSource.filterPredicate = (data: FlattenedData, filter: string) => {
      const searchTerms = JSON.parse(filter);
      return Boolean((
        (data.classDescription.en.toLowerCase().includes(searchTerms.classDescription.toLowerCase()) ||
          data.classDescription.fr.toLowerCase().includes(searchTerms.classDescription.toLowerCase())) &&
        (data.subclassDescription.en.toLowerCase().includes(searchTerms.subclassDescription.toLowerCase()) ||
          data.subclassDescription.fr.toLowerCase().includes(searchTerms.subclassDescription.toLowerCase())) &&
        (data?.accountDescription?.en?.toLowerCase().includes(searchTerms.accountDescription.toLowerCase()) ||
          data?.accountDescription?.fr?.toLowerCase().includes(searchTerms.accountDescription.toLowerCase()) )
      ));
    };
  }

  updateFilter(newFilter: Partial<{ class: string; subClass: string; acc: string }>): void {
    const mergedFilter = JSON.stringify({ ...newFilter });

    console.log('Assigned Filter Value:', mergedFilter);

    this.flattenedTableDataSource.filter = mergedFilter;
  }

  /** ============================
   * 🔹 Autocomplete Filter Logic
   * ============================ */
  initializeAutocomplete(): void {
    this.filteredClassOptions = this.classControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(this.classOptions, value))
    );

    this.filteredSubClassOptions = this.subClassControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(this.subclassOptions, value))
    );
  }

  displayClassFn(value: { value: string, label: string }): string {
    return typeof value === 'object' ? `${value.value} - ${value.label}`:'';
  }

  clearFormField(fieldName: string, emitEvent: boolean = true): void {
    this.accountsFilterForm.get(fieldName)?.setValue(null, {emitEvent});
  }

  getFormFieldValue(fieldName: string): string | null {
    return this.accountsFilterForm.get(fieldName)?.value;
  }

  public onClassSelection(selectClassEvent: MatAutocompleteSelectedEvent): void {
    this.accountsFilterForm.get(FIELD_NAMES.CLASS_DESCRIPTION)?.setValue(selectClassEvent.option.value.value)
    this.subclassOptions = this.getSubclassOptions(selectClassEvent.option.value.value);
  }

  public onSubClassSelection(selectClassEvent: MatAutocompleteSelectedEvent): void {
    this.accountsFilterForm.get(FIELD_NAMES.SUBCLASS_DESCRIPTION)?.setValue(selectClassEvent.option.value.value)
  }

  private _filter(source: { value: string, label: string }[], value: string | null | {
    value: string,
    label: string
  }): { value: string, label: string }[] {
    if (!value) return source;

    const filterValue = typeof value==='string' ? value.toLowerCase():value?.label?.toLowerCase() || '';

    return source.filter(option =>
      option.label.toLowerCase().includes(filterValue)
    );
  }

  getClassOptions(): { value: string, label: string }[] {
    return Object.keys(this.storedV.classes).map((classId) => ({
      value: classId,
      // @ts-ignore
      label: this.storedV.classes[classId.toString()]?.classDescription?.en, // ✅ No more error!
    }));
  }

  loadData(): void {
    this.flattenedTableDataSource = new MatTableDataSource<FlattenedData>(ACCOUNTS_F as FlattenedData[]);
  }


  getSubclassOptions(classId?: string): { value: string, label: string }[] {
    if (!classId) {
      const subKeys = Object.keys(this.storedV.subclasses).filter(id => id!=='undefined' && id!==null);
      return subKeys.map((subclassId) => ({
        value: subclassId,
        // @ts-ignore
        label: this.storedV.subclasses[subclassId.toString()].subclassDescription?.en, // ✅ No more error!
      }));
    } else {
      // @ts-ignore
      const classData = this.storedV.classes[classId];
      if (!classData) return [];
      // @ts-ignore
      return classData.subclassIds.filter(id => id!==null).map(subclassId => ({
        value: subclassId,
        // @ts-ignore
        label: this.storedV.subclasses[subclassId]?.subclassDescription.en || "Unknown"
      }));
    }
  }

  // saveFlattenedDataToFile(staticFlattenedData: FlattenedData[]): void {
  //   this.fileService.saveAsJsonFile(staticFlattenedData, 'flattenedData.json');
  // }
}
