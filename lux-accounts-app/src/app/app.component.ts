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
  ACCOUNT_NUMBER: 'accountNumber',

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
  subclassOptions: { value: string, label: string }[] = this.getSubclassOptions();

  filteredClassOptions!: Observable<{ value: string, label: string }[]>;
  filteredSubClassOptions!: Observable<{ value: string, label: string }[]>;
  filteredSearchResults!: Observable<string[]>;

  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
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
  flattenedDataSource: FlattenedData[] = [];

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

  ngOnInit(): void {

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
      console.log(this.flattenedDataSource.length)
      // @ts-ignore
      let searchParam = typeof searchedString==='object' ? searchedString?.label:searchedString;
      this.flattenedDataSource = this.flattenedDataSource.filter(td =>
        td.classDescription.en.toLowerCase().includes(searchParam?.toLowerCase() ?? '')
        || td.classDescription.fr.toLowerCase().includes(searchParam?.toLowerCase() ?? ''))
      console.log(this.flattenedDataSource.length)
    })

    this.subClassControl
      ?.valueChanges.subscribe((searchedString) => {
      console.log(this.flattenedDataSource.length)
      // @ts-ignore
      let searchParam = typeof searchedString==='object' ? searchedString?.label:searchedString;

      this.flattenedDataSource = this.flattenedDataSource.filter(td =>
        td.subclassDescription.en.toLowerCase().includes(searchParam?.toLowerCase() ?? '')
        || td.subclassDescription.fr.toLowerCase().includes(searchParam?.toLowerCase() ?? ''))
      console.log(this.flattenedDataSource.length)
    })

    this.accControl.valueChanges.subscribe((accName) => {
      console.log(accName, 'accbn')
      this.flattenedDataSource = this.flattenedDataSource.filter(td =>
        td.subclassDescription.en.toLowerCase().includes(accName?.toLowerCase() ?? '')
        || td.subclassDescription.fr.toLowerCase().includes(accName?.toLowerCase() ?? ''))
      console.log(this.flattenedDataSource.length)
    })
  }

  displayClassFn(value: { value: string, label: string }): string {
    return value ? `${value.value} - ${value.label}`:'';
  }

  clearFormField(fieldName: string, emitEvent: boolean = true): void {
    this.accountsFilterForm.get(fieldName)?.setValue(null, {emitEvent});
  }

  getFormFieldValue(fieldName: string): string | null {
    return this.accountsFilterForm.get(fieldName)?.value;
  }

  public onClassSelection(selectClassEvent: MatAutocompleteSelectedEvent): void {
    this.subclassOptions = this.getSubclassOptions(selectClassEvent.option.value.value);
  }

  public onSubClassSelection(selectClassEvent: MatAutocompleteSelectedEvent): void {
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

  flattenData() {
    this.dataSource.classes.forEach(classItem => {
      classItem.subclasses.forEach(subclass => {
        subclass.accounts.forEach(account => {
          this.flattenedDataSource.push({
            classNumber: classItem.classNumber,
            classDescription: classItem.classDescription,
            subclassNumber: subclass.subclassNumber,
            subclassDescription: subclass.subclassDescription || {en: 'N/A', fr: 'N/A'},
            accountNumber: account.accountNumber,
            accountDescription: account.accountDescription
          });
        });
      });
    });
  }

  getSubclassOptions(classId?: string): { value: string, label: string }[] {
    if (!classId) {
      const subKeys = Object.keys(this.storedV.subclasses).filter(id => id!=='undefined' && id!==null);
      console.log(subKeys, 'SUB');
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
