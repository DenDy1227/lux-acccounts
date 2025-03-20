import {ChangeDetectorRef, Component, DestroyRef, inject, OnInit} from '@angular/core';
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
import {MatIconButton} from "@angular/material/button";
import {ACCOUNTS} from "./source/accounts";
import {MatTableModule} from "@angular/material/table";
import {accTransformed} from "./source/thransformedAccounts";


const FIELD_NAMES = {
  CLASS_DESCRIPTION: 'classDescription',
  CLASS_NUMBER: 'classNumber',
  SUBCLASS_DESCRIPTION: 'subclassDescription',
  SUBCLASS_NUMBER: 'subclassNumber',
  DESCRIPTION: 'description',
  ACCOUNT_NUMBER:'accountNumber',

} as const

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
  imports: [RouterOutlet, MatTableModule, CommonModule, MatFormFieldModule, MatIconModule, MatInput, ReactiveFormsModule, MatAutocomplete, MatAutocompleteTrigger, MatOption, MatIconButton],
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
  // subclassOptionsMap: Map<string, string[]> = new Map();
  subclassOptions: { value: string, label: string }[] = this.getSubclassOptions();
  searchOptions: string[] = [];

  filteredClassOptions!: Observable<{ value: string, label: string }[]>;
  filteredSubClassOptions!: Observable<{ value: string, label: string }[]>;
  filteredSearchResults!: Observable<string[]>;


  // displayedColumns: string[] = ['class', 'accountNumber', 'subclass',];
  // dataSource = JSON.parse(ACCOUNTS);

  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  filteredTableData: FlattenedData[] = [];

  displayedColumns: string[] = [
    'classNumber',
    'classDescription',
    'subclassNumber',
    'subclassDescription',
    'accountNumber',
    'accountDescription'
  ];
  dataSource = ACCOUNTS;

  selectedClass: string = '';
  selectedSubclass: string = '';
  flattenedDataSource: FlattenedData[] = [];
  // filteredTableData = [];
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
  }


    // this.subclassOptionsMap.set('CLASS_1',['SUBCLASS_11', 'SUBCLASS_12', 'SUBCLASS_13']);
    // this.subclassOptionsMap.set('CLASS_2',['SUBCLASS_21', 'SUBCLASS_22', 'SUBCLASS_23']);
    // this.subclassOptionsMap.set('CLASS_3',['SUBCLASS_31', 'SUBCLASS_32', 'SUBCLASS_33']);
    // this.subclassOptionsMap.set('CLASS_4',['SUBCLASS_41', 'SUBCLASS_42', 'SUBCLASS_43']);
    // this.subclassOptionsMap.set('CLASS_5',['SUBCLASS_51', 'SUBCLASS_52', 'SUBCLASS_53']);
    // this.subclassOptionsMap.set('CLASS_6',['SUBCLASS_61', 'SUBCLASS_62', 'SUBCLASS_63']);
    // this.subclassOptionsMap.set('CLASS_7',['SUBCLASS_71', 'SUBCLASS_72', 'SUBCLASS_73']);


  ngOnInit(): void {
    // const transformedJson = transformJson(ACCOUNTS);
// console.log(accTransformed, this.classOptions, this.subclassOptions)
    // console.table(this.subclassOptions)
console.log(this.flattenedDataSource)
    // this.activatedRoute.queryParams.pipe(
    //   filter(Boolean),
    //   takeUntilDestroyed(this.destroyRef)
    // ).subscribe((p:Params) => this.accountsFilterForm.patchValue(p))

    this.accountsFilterForm
      .valueChanges
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef))
      // .subscribe(accounts => {this._applyParamsToData(accounts)});

    // this.filteredSearchResults = this.searchControl.valueChanges.pipe(
    //   startWith(''),
    //   map(value => this._filter(this.searchOptions,value || '')),
    // );

    this.filteredClassOptions = this.classControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(this.classOptions, value)),
    );

    this.filteredSubClassOptions = this.subClassControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(this.subclassOptions, value)),

    );

    // this.accountsFilterForm.get
    this.classControl
      ?.valueChanges.subscribe((searchedString) => {
      console.log(this.flattenedDataSource.length)
      // @ts-ignore
      let searchParam =  typeof  searchedString === 'object' ? searchedString?.label: searchedString;
      this.flattenedDataSource = this.flattenedDataSource.filter(td =>
        td.classDescription.en.toLowerCase().includes(searchParam?.toLowerCase() ?? '')
        || td.classDescription.fr.toLowerCase().includes(searchParam?.toLowerCase() ?? '') )
      console.log(this.flattenedDataSource.length)
    })

    this.subClassControl
      ?.valueChanges.subscribe((searchedString) => {
      console.log(this.flattenedDataSource.length)
      // @ts-ignore
      let searchParam =  typeof  searchedString === 'object' ? searchedString?.label: searchedString;

      this.flattenedDataSource = this.flattenedDataSource.filter(td =>
        td.subclassDescription.en.toLowerCase().includes(searchParam?.toLowerCase() ?? '')
        || td.subclassDescription.fr.toLowerCase().includes(searchParam?.toLowerCase() ?? '') )
      console.log(this.flattenedDataSource.length)
    })

    // this.accountsFilterForm.get(FIELD_NAMES.DESCRIPTION)?
      this.accControl.valueChanges.subscribe((accName) => {
      console.log(accName,'accbn')
        this.flattenedDataSource = this.flattenedDataSource.filter(td =>
          td.subclassDescription.en.toLowerCase().includes(accName?.toLowerCase() ?? '')
          || td.subclassDescription.fr.toLowerCase().includes(accName?.toLowerCase() ?? '') )
        console.log(this.flattenedDataSource.length)
    })


    // this.initSubClassOptions()
    // this.subclassOptions$ = this.accountsFilterForm.get(FIELD_NAMES.CLASS_DESCRIPTION)?.valueChanges
    //   .pipe(
    //   map(selectedClass => {
    //   return this.subclassOptions.get(selectedClass) ?? [];
    // }))
  }

  filterOptions(value: string, options: any[]): any[] {
    const filterValue = value.toLowerCase();
    return options.filter(option =>
      option.label.toLowerCase().includes(filterValue)
    );
  }

  applyFilters() {
    const classFilter = this.accountsFilterForm.get(FIELD_NAMES.CLASS_DESCRIPTION)?.value.toLowerCase() || '';
    const subclassFilter = this.accountsFilterForm.get(FIELD_NAMES.SUBCLASS_DESCRIPTION)?.value.toLowerCase() || '';
    const accountFilter = this.accountsFilterForm.get(FIELD_NAMES.ACCOUNT_NUMBER)?.value.toLowerCase() || '';


    this.filteredTableData = this.flattenedDataSource.filter(item =>
      (!classFilter || item.classNumber.toLowerCase().includes(classFilter)) &&
      // @ts-ignore
      (!subclassFilter || item?.subclassNumber?.toLowerCase().includes(subclassFilter)) &&
      // @ts-ignore
      (!accountFilter || item?.accountNumber?.toLowerCase().includes(accountFilter))
    );
  }

  displaySubClassFn(): string {
    return this.accountsFilterForm?.get(FIELD_NAMES.SUBCLASS_DESCRIPTION)?.value ?? '';
  }

  displayClassFn(value: { value: string, label: string }): string {

    return value ? `${value.value} - ${value.label}` : '';
    // return this.accountsFilterForm?.get(FIELD_NAMES.CLASS_DESCRIPTION)?.value ?? '';
  }

  clearFormField(fieldName: string, emitEvent: boolean = true): void {
    this.accountsFilterForm.get(fieldName)?.setValue(null,{emitEvent});
  }

  getFormFieldValue(fieldName: string): string | null {
    return this.accountsFilterForm.get(fieldName)?.value;
  }

  public onClassSelection(selectClassEvent: MatAutocompleteSelectedEvent): void {
    console.log('matAutoCompleteEv', selectClassEvent.option.value)
    // this.accountsFilterForm.get(FIELD_NAMES.CLASS_DESCRIPTION)?.setValue(selectClassEvent.option.value)
    // this.subclassOptions = this.subclassOptionsMap.get(selectClassEvent.option.value) ?? [];

    // console.log(this.subclassOptions)

    // this.selectedClass = selectClassEvent.option.value.value;
    this.subclassOptions = this.getSubclassOptions(selectClassEvent.option.value.value);
    // this.subClassControl.setValue('');
    console.log( this.subclassOptions)
    // this.cdr.markForCheck();
  }

  public onSubClassSelection(selectClassEvent: MatAutocompleteSelectedEvent): void {
    console.log('matAutoCompleteEv', selectClassEvent.option.value);
    this.selectedSubClass = selectClassEvent.option.value;
    // this.accountsFilterForm.get(FIELD_NAMES.SUBCLASS_DESCRIPTION)?.setValue(selectClassEvent.option.value);
    // this.accountsFilterForm.get(FIELD_NAMES.CLASS_DESCRIPTION)
    //   ?.setValue(this.getClassFromSubClassDefinition(selectClassEvent.option.value));
    // this.classControl.setValue('');
    // this.subclassOptions = this.subclassOptionsMap.get(selectClassEvent.option.value) ?? [];
    console.log( this.subclassOptions)
  }

  private getClassFromSubClassDefinition(subclassName: string): string {
    let resultClassname='';
    // this.subclassOptionsMap.forEach((subClasses, className) => {
    //   if(subClasses.includes(subclassName)) {
    //     resultClassname = className;
    //   }
    // })
    return resultClassname;
  }

  private _filter(source: { value: string, label: string }[],  value: string | null | { value: string, label: string }): { value: string, label: string }[] {
console.log(value,'filtere')
    if (!value) return source;

    const filterValue = typeof value === 'string' ? value.toLowerCase() : value?.label?.toLowerCase() || '';

    return source.filter(option =>
      option.label.toLowerCase().includes(filterValue)
    );
  }

  private initSubClassOptions() {
    // const classSelected = this.accountsFilterForm.get(FIELD_NAMES.CLASS_DESCRIPTION)?.value;
    // if (classSelected) {
    //   // this.subclassOptions = this.subclassOptionsMap.get(classSelected) ?? [];
    // } else {
    //   let allSubClassOptions: any[] = []
    //   for (let value of this.subclassOptionsMap.values()) {
    //     allSubClassOptions = [...allSubClassOptions, ...value];
    //   }
    //   this.subclassOptions = allSubClassOptions;
    // }
  }

  // private _applyParamsToData(value: Params): void {
  //   this.router.navigate(['.'], {
  //     queryParams: value,
  //     relativeTo: this.activatedRoute,
  //   });
  //   this.cdr.markForCheck();
  // }
  selectedSubClass: any;

  getClassOptions(): { value: string, label: string }[] {
    return Object.keys(this.storedV.classes).map((classId) => ({
      value: classId,
      // @ts-ignore
      label: this.storedV.classes[classId.toString()]?.classDescription?.en, // ✅ No more error!
    }));
  }

  flattenData() {
    this.dataSource.classes.forEach(classItem => {
      classItem.subclasses.forEach(subclass => {
        subclass.accounts.forEach(account => {
          this.flattenedDataSource.push({
            classNumber: classItem.classNumber,
            classDescription: classItem.classDescription,
            subclassNumber: subclass.subclassNumber,
            subclassDescription: subclass.subclassDescription || { en: 'N/A', fr: 'N/A' },
            accountNumber: account.accountNumber,
            accountDescription: account.accountDescription
          });
        });
      });
    });
  }

  getSubclassOptions(classId?: string): { value: string, label: string }[] {
    if(!classId) {
      const subKeys = Object.keys(this.storedV.subclasses).filter(id => id !== 'undefined' && id !== null);
      console.log(subKeys,'SUB');
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
      return classData.subclassIds.filter(id => id !== null).map(subclassId => ({
        value: subclassId,
        // @ts-ignore
        label: this.storedV.subclasses[subclassId]?.subclassDescription.en || "Unknown"
      }));
    }

  }
}

function transformJson(originalJson: any) {
  const transformedData = {
    classes: {} as Record<string, any>,
    subclasses: {} as Record<string, any>,
    accounts: {} as Record<string, any>
  };

  originalJson.classes.forEach((cls: any) => {
    const classId = cls.classNumber;

    transformedData.classes[classId] = {
      classNumber: classId,
      classDescription: cls.classDescription,
      subclassIds: cls.subclasses.map((sub: any) => sub.subclassNumber)
    };

    cls.subclasses.forEach((sub: any) => {
      const subclassId = sub.subclassNumber;

      transformedData.subclasses[subclassId] = {
        subclassNumber: subclassId,
        subclassDescription: sub.subclassDescription,
        accountIds: sub.accounts.map((acc: any) => acc.accountNumber)
      };

      sub.accounts.forEach((acc: any) => {
        transformedData.accounts[acc.accountNumber] = {
          accountNumber: acc.accountNumber,
          accountDescription: acc.accountDescription,
          subclassId: subclassId
        };
      });
    });
  });

  return transformedData;
}

