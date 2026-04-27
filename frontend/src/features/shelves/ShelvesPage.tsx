import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProfile } from '../profile/hooks/useProfile';
import { useShelves, type Shelf, type Book } from './hooks/useShelves';
import { useAddBook, useDeleteBook, useMoveBook } from './hooks/useShelfMutations';
import { useAuthStore } from '../../shared/store/useAuthStore';

export function ShelvesPage() {
  const { nickname } = useParams<{ nickname: string }>();
  const { user } = useAuthStore();
  const { data: profile, isLoading: profileLoading } = useProfile(nickname ?? '');
  const userId = profile?.userId as number | undefined;

  const { data: shelves, isLoading } = useShelves(userId);
  const addBook = useAddBook(userId);
  const deleteBook = useDeleteBook(userId);
  const moveBook = useMoveBook(userId);

  const [addingTo, setAddingTo] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');

  const isOwn = user?.nickname === nickname;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingTo) return;
    await addBook.mutateAsync({ shelfId: addingTo, title, author });
    setTitle('');
    setAuthor('');
    setAddingTo(null);
  };

  if (profileLoading || isLoading) {
    return <p style={{ textAlign: 'center', padding: '2rem' }}>Loading...</p>;
  }

  if (!profile) {
    return <p style={{ textAlign: 'center', padding: '2rem' }}>User not found.</p>;
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <Link to={`/u/${nickname}`} style={{ color: '#646cff', textDecoration: 'none', fontSize: '0.875rem' }}>← @{nickname}</Link>
      <h2 style={{ margin: '0.75rem 0 1.5rem' }}>Bookshelves</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {shelves?.map((shelf) => (
          <ShelfCard
            key={shelf.shelfId}
            shelf={shelf}
            allShelves={shelves}
            isOwn={isOwn}
            onAdd={() => setAddingTo(shelf.shelfId)}
            onDelete={(bookId) => deleteBook.mutate(bookId)}
            onMove={(bookId, toShelfId) => moveBook.mutate({ bookId, toShelfId })}
          />
        ))}
      </div>

      {addingTo !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ marginTop: 0 }}>Add a book</h3>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                required
                maxLength={255}
                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
              />
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author"
                required
                maxLength={255}
                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setAddingTo(null)} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #ccc', background: '#f5f5f5', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={addBook.isPending} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: '#646cff', color: '#fff', cursor: 'pointer' }}>
                  {addBook.isPending ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface ShelfCardProps {
  shelf: Shelf;
  allShelves: Shelf[];
  isOwn: boolean;
  onAdd: () => void;
  onDelete: (bookId: number) => void;
  onMove: (bookId: number, toShelfId: number) => void;
}

function ShelfCard({ shelf, allShelves, isOwn, onAdd, onDelete, onMove }: ShelfCardProps) {
  return (
    <section style={{ background: '#fafafa', borderRadius: '12px', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h3 style={{ margin: 0 }}>{shelf.name}</h3>
        {isOwn && (
          <button onClick={onAdd} style={{ padding: '4px 12px', borderRadius: '16px', border: '1px solid #646cff', background: 'transparent', color: '#646cff', cursor: 'pointer', fontSize: '0.875rem' }}>
            + Add book
          </button>
        )}
      </div>

      {shelf.books.length === 0 ? (
        <p style={{ color: '#aaa', fontSize: '0.875rem', margin: 0 }}>No books yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {shelf.books.map((book: Book) => (
            <li key={book.bookId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: '#fff', borderRadius: '8px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{book.title}</div>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>{book.author}</div>
              </div>
              {isOwn && (
                <>
                  <select
                    value={shelf.shelfId}
                    onChange={(e) => onMove(book.bookId, Number(e.target.value))}
                    style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.85rem' }}
                  >
                    {allShelves.map((s) => (
                      <option key={s.shelfId} value={s.shelfId}>{s.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => onDelete(book.bookId)}
                    style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}
                  >✕</button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
