import {ChangeDetectorRef, Component, DestroyRef, HostListener, inject, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Params, Router, RouterOutlet} from '@angular/router';
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatIconModule} from "@angular/material/icon";
import {MatInput} from "@angular/material/input";
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {filter, map, Observable, of, startWith, take, tap} from "rxjs";
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
  imports: [RouterOutlet, MatTableModule, CommonModule, MatFormFieldModule, MatIconModule, MatInput, ReactiveFormsModule, MatAutocomplete, MatAutocompleteTrigger, MatOption, MatIconButton, GetClassColorPipe, MatFabButton],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
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
  flattenedDataSource:FlattenedData[] = [];
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

  // @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor() {
    this.accountsFilterForm = this.fb.group({
      [FIELD_NAMES.CLASS_DESCRIPTION]: [null],
      [FIELD_NAMES.SUBCLASS_DESCRIPTION]: [null],
      [FIELD_NAMES.DESCRIPTION]: [null],
      [FIELD_NAMES.ACCOUNT_NUMBER]: [null],
      [FIELD_NAMES.CLASS_NUMBER]: [null],
      [FIELD_NAMES.SUBCLASS_NUMBER]: [null],
    });
    this.flattenData();
    // this.flattenedDataSource = this.flattenData();
    // this.flattenedTableDataSource = new MatTableDataSource(this.flattenData())
  }

  ngOnInit(): void {
    this.initializeFilters();
    this.initializeAutocomplete();
console.log(this.flattenedTableDataSource)
    this.filteredClassOptions = this.classControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(this.classOptions, value)),
    );

    this.filteredSubClassOptions = this.subClassControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(this.subclassOptions, value)),
    );

    this.classControl
      ?.valueChanges.subscribe((searchedString) => {

      if (!searchedString) {
        // this.flattenData()
      } else {
        // @ts-ignore
        let searchParam = typeof searchedString==='object' ? searchedString?.label:searchedString;
        this.flattenedDataSource = this.flattenedDataSource.filter(td =>
          td.classDescription.en.toLowerCase().includes(searchParam?.toLowerCase() ?? '')
          || td.classDescription.fr.toLowerCase().includes(searchParam?.toLowerCase() ?? ''))
      }

    })

    this.classControl?.valueChanges.subscribe((searchedString) => {

      if (!searchedString) {
        // this.flattenData()
      } else {
        // Ensure search term is handled correctly
        //@ts-ignore
        const searchParam = typeof searchedString==='object' ? searchedString?.label:searchedString;
        this.flattenedDataSource.filter = searchParam?.trim().toLowerCase() ?? '';
      }

    });

    this.subClassControl
      ?.valueChanges.subscribe((searchedString) => {

      if (!searchedString) {
// this.flattenData()
      } else {
        // @ts-ignore
        let searchParam = typeof searchedString==='object' ? searchedString?.label:searchedString;
        this.flattenedDataSource = this.flattenedDataSource.filter(td =>
          td.subclassDescription.en.toLowerCase().includes(searchParam?.toLowerCase() ?? '')
          || td.subclassDescription.fr.toLowerCase().includes(searchParam?.toLowerCase() ?? ''))
      }

    })

    // this.subClassControl?.valueChanges.subscribe((searchedString) => {
    //   // @ts-ignore
    //   const searchParam = typeof searchedString === 'object' ? searchedString?.label : searchedString;
    //   this.updateFilter({ subClass: searchParam });
    // });

    this.accControl.valueChanges.subscribe((accName) => {
      if(!accName) {
        console.log(accName);
      } else {
        this.flattenedDataSource = this.flattenedDataSource.filter(td =>
          td.subclassDescription.en.toLowerCase().includes(accName?.toLowerCase() ?? '')
          || td.subclassDescription.fr.toLowerCase().includes(accName?.toLowerCase() ?? ''))
      }

    })

    // this.accControl?.valueChanges.subscribe((accName) => {
    //   this.updateFilter({ acc: accName ?? '' });
    // });
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
          this.flattenData();  // Restore the original data
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

  updateFilter(newFilter: Partial<{ classDescription: string; subclassDescription: string; accountDescription: string }>): void {
    const currentFilter = this.flattenedTableDataSource.filter
      ? JSON.parse(this.flattenedTableDataSource.filter)
      : { classDescription: '', subclassDescription: '', accountDescription: '' };

    const mergedFilter = { ...currentFilter, ...newFilter };
    this.flattenedTableDataSource.filter = JSON.stringify(mergedFilter);

    console.log('Filtered Data Length:', this.flattenedTableDataSource.filteredData.length);
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

  // flattenData() : any[] {
  //   const accounts: any [] = []
  //   this.dataSource.classes.forEach(classItem => {
  //     classItem.subclasses.forEach(subclass => {
  //       subclass.accounts.forEach(account => {
  //         accounts.push({
  //           classNumber: classItem.classNumber,
  //           classDescription: classItem.classDescription,
  //           subclassNumber: subclass.subclassNumber,
  //           subclassDescription: subclass.subclassDescription || {en: 'N/A', fr: 'N/A'},
  //           accountNumber: account.accountNumber,
  //           accountDescription: account.accountDescription
  //         });
  //       });
  //     });
  //   });
  //   return accounts;
  // }

  private flattenData(): void {
    const accounts: any [] = []
    this.flattenedTableDataSource.data = this.dataSource.classes.flatMap(classItem =>
      classItem.subclasses.flatMap(subclass =>
        subclass.accounts.map(account => ({
          classNumber: classItem.classNumber,
          classDescription: classItem.classDescription,
          subclassNumber: subclass.subclassNumber,
          subclassDescription: subclass.subclassDescription || { en: 'N/A', fr: 'N/A' },
          accountNumber: account.accountNumber,
          accountDescription: account.accountDescription
        }))
      )
    );
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
}
