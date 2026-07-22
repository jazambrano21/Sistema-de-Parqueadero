import { Column, Entity, Index, PrimaryGeneratedColumn, TableInheritance } from 'typeorm';

export enum Clasificacion {
  ELECTRICO = 'Eléctrico',
  HIBRIDO = 'Híbrido',
  GASOLINA = 'Gasolina',
  DIESEL = 'Diésel',
}

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'tipo' } })
export abstract class Vehiculo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  placa!: string;

  @Column()
  marca!: string;

  @Column()
  modelo!: string;

  @Column()
  color!: string;

  @Column()
  anio!: number;

  @Column()
  clasificacion!: Clasificacion;

  /**
   * ID del tenant (parqueadero) al que pertenece este vehículo.
   * Permite que cada parqueadero gestione su propio catálogo de vehículos.
   * Nullable para compatibilidad con registros anteriores.
   */
  @Index()
  @Column({ nullable: true, type: 'varchar' })
  tenantId!: string | null;

  abstract getTipo(): string;
}