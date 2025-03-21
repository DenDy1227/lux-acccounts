import {Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatIconModule} from "@angular/material/icon";
import {MatInput} from "@angular/material/input";
import {FormControl, ReactiveFormsModule} from "@angular/forms";
import {map, Observable, startWith, throttleTime} from "rxjs";

import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
  MatOption
} from "@angular/material/autocomplete";
import {CommonModule} from "@angular/common";
import {MatFabButton, MatIconButton} from "@angular/material/button";
import {MatTableDataSource, MatTableModule} from "@angular/material/table";
import {GetClassColorPipe} from "./utils/get-class-color.pipe";
import {MatPaginator, MatPaginatorModule} from "@angular/material/paginator";

import {ACCOUNTS_F} from "./source/flatSource";
import {subClassOptions} from "./source/subClassOptions";
import {classOption} from "./source/classOptions";

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
  imports: [RouterOutlet, MatTableModule, CommonModule, MatFormFieldModule, MatIconModule, MatInput, MatAutocomplete, MatAutocompleteTrigger, MatOption, MatIconButton, GetClassColorPipe, MatFabButton, ReactiveFormsModule, MatPaginatorModule, MatPaginator],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  classControl = new FormControl('');
  searchControl = new FormControl('');
  subClassControl = new FormControl('');
  accControl = new FormControl('');

  classOptions: { value: string, label: string }[] = classOption;
  subclassOptions: { value: string, label: string }[] = subClassOptions;

  filteredClassOptions!: Observable<{ value: string, label: string }[]>;
  filteredSubClassOptions!: Observable<{ value: string, label: string }[]>;
  filteredSearchResults!: Observable<string[]>;

  // private fb = inject(FormBuilder);
  // private destroyRef = inject(DestroyRef);

  flattenedTableDataSource = new MatTableDataSource<FlattenedData,MatPaginator>([]);
  displayedColumns: string[] = [
    'classNumber',
    'classDescription',
    'subclassNumber',
    'subclassDescription',
    'accountNumber',
    'accountDescription'
  ];

  public showScrollButton = false; // Controls when the button appears

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.showScrollButton = window.scrollY > 300;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator;

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

  ngAfterViewInit(): void {
    this.flattenedTableDataSource.paginator = this.paginator;
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

  public onClassSelection(selectClassEvent: MatAutocompleteSelectedEvent): void {
    // this.accountsFilterForm.get(FIELD_NAMES.CLASS_DESCRIPTION)?.setValue(selectClassEvent.option.value.value)
    // this.subclassOptions = this.getSubclassOptions(selectClassEvent.option.value.value);
  }
  //
  public onSubClassSelection(selectClassEvent: MatAutocompleteSelectedEvent): void {
    // this.accountsFilterForm.get(FIELD_NAMES.SUBCLASS_DESCRIPTION)?.setValue(selectClassEvent.option.value.value)
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

  loadData(): void {
    this.flattenedTableDataSource = new MatTableDataSource<FlattenedData>(ACCOUNTS_F as FlattenedData[]);
  }

  // saveFlattenedDataToFile(staticFlattenedData: any[]): void {
  //   this.fileService.saveAsJsonFile(staticFlattenedData, 'flattenedData.json');
  // }
}
