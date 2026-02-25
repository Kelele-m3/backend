import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn, } from 'typeorm';
import { Article } from '../../articles/entities/article.entity';
import { User } from '../../users/entities/user.entity';

@Entity('read_logs')
export class ReadLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'article_id', type: 'uuid' })
  articleId: string;

  @ManyToOne(() => Article, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article: Article;

  @Column({ name: 'reader_id', type: 'uuid', nullable: true })
  readerId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reader_id' })
  reader: User | null;

  /** Optional id for guest readers (e.g. from X-Guest-Id header) for deduplication. */
  @Column({ name: 'guest_id', type: 'varchar', length: 255, nullable: true })
  guestId: string | null;

  @CreateDateColumn({ name: 'read_at' })
  readAt: Date;
}
