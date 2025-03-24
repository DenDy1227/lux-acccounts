import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'getClassColor',
  standalone: true
})
export class GetClassColorPipe implements PipeTransform {

  transform(classNumber: string, ...args: unknown[]): unknown {
    switch (classNumber) {
      case "1" : {
        return 'first'
      }
      case "2" : {
        return 'second'
      }
      case "3": {
        return 'third'
      }
      case "4" : {
        return 'fourth'
      }
      case "5" : {
        return 'fifth'
      }
      case "6" : {
        return 'six'
      }
      case "7" : {
        return 'seven'
      }
      default : return 'default'
    }
  }
}
