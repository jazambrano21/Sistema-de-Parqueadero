import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

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

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()   // ← corregido: era @CreateDateColumn por error
  updatedAt!: Date;
}
