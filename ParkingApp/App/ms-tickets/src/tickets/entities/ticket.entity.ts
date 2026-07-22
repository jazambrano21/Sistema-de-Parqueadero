import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('tickets')
export class Ticket {

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  placa!: string;

  @Column()
  dni!: string;

  @Column({ type: 'uuid' })
  idEspacio!: string;

  @Column()
  nombreZona!: string;

  @Column({ type: 'timestamp' })
  fechaHoraIngreso!: Date;

  @Column({ type: 'timestamp', nullable: true })
  fechaHoraSalida!: Date;

  @Column({ default: true })
  activo!: boolean;

  @Column({ type: 'float', default: 0 })
  valorRecaudado!: number;

  /**
   * ID del tenant (parqueadero) al que pertenece este ticket.
   * Permite aislar los tickets de cada parqueadero cliente.
   * Nullable para compatibilidad con registros anteriores.
   */
  @Index()
  @Column({ nullable: true, type: 'varchar' })
  tenantId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
