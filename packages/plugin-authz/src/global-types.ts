/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  FieldNullability,
  InputFieldMap,
  InterfaceParam,
  SchemaTypes,
  TypeParam,
} from '@pothos/core';
import { AuthZOption, PothosAuthZPlugin } from '.';

declare global {
  export namespace PothosSchemaTypes {
    export interface Plugins<Types extends SchemaTypes> {
      authz: PothosAuthZPlugin<Types>;
    }

    export interface UserSchemaTypes {
      AuthZRule: string;
    }

    export interface ExtendDefaultTypes<PartialTypes extends Partial<UserSchemaTypes>> {
      AuthZRule: PartialTypes['AuthZRule'] & string;
    }

    export interface FieldOptions<
      Types extends SchemaTypes,
      ParentShape,
      Type extends TypeParam<Types>,
      Nullable extends FieldNullability<Type>,
      Args extends InputFieldMap,
      ResolveShape,
      ResolveReturnShape,
    > {
      authz?: AuthZOption<Types>;
    }

    export interface ObjectTypeOptions<Types extends SchemaTypes = SchemaTypes, Shape = unknown> {
      authz?: AuthZOption<Types>;
    }

    export interface InterfaceTypeOptions<
      Types extends SchemaTypes = SchemaTypes,
      Shape = unknown,
      Interfaces extends InterfaceParam<Types>[] = InterfaceParam<Types>[],
    > {
      authz?: AuthZOption<Types>;
    }
  }
}
