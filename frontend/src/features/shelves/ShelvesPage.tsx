import {useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {useProfile} from '../profile/hooks/useProfile';
import {type Book, type Shelf, useShelves} from './hooks/useShelves';
import {useAddBook, useDeleteBook, useMoveBook} from './hooks/useShelfMutations';
import {useAuthStore} from '../../shared/store/useAuthStore';

export function ShelvesPage() {
  const {t} = useTranslation();
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
    setTitle(''); setAuthor(''); setAddingTo(null);
  };

  if (profileLoading || isLoading) return <div className="px-8 py-12 text-center text-[#7a6f68]">{t('common.loading')}</div>;
  if (!profile) return <div className="px-8 py-12 text-center text-[#7a6f68]">{t('errors.notFound')}</div>;

  return (
    <div className="px-8 py-6">
      <Link to={`/u/${nickname}`} className="text-sm text-[#7a6f68] hover:text-[#5b63d3] transition-colors">← @{nickname}</Link>
      <h2 className="font-serif text-2xl font-bold text-[#1c1714] mt-3 mb-6">{t('nav.shelves')}</h2>

      <div className="space-y-4">
        {shelves?.map((shelf) => (
          <ShelfCard key={shelf.shelfId} shelf={shelf} allShelves={shelves} isOwn={isOwn}
            onAdd={() => setAddingTo(shelf.shelfId)}
            onDelete={(bookId) => deleteBook.mutate(bookId)}
            onMove={(bookId, toShelfId) => moveBook.mutate({ bookId, toShelfId })}
          />
        ))}
      </div>

      {addingTo !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-serif font-bold text-[#1c1714] mb-4">{t('shelves.addBook')}</h3>
            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('shelves.title')} required maxLength={255}
                className="w-full px-3 py-2.5 rounded-lg border border-[#e8e2d9] bg-white text-sm focus:outline-none focus:border-[#5b63d3] focus:ring-2 focus:ring-[#5b63d3]/20 transition" />
              <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder={t('shelves.author')} required maxLength={255}
                className="w-full px-3 py-2.5 rounded-lg border border-[#e8e2d9] bg-white text-sm focus:outline-none focus:border-[#5b63d3] focus:ring-2 focus:ring-[#5b63d3]/20 transition" />
              <div className="flex gap-2 justify-end mt-1">
                <button type="button" onClick={() => setAddingTo(null)}
                        className="px-4 py-2 rounded-lg border border-[#e8e2d9] bg-white text-sm text-[#7a6f68] cursor-pointer hover:border-[#5b63d3] transition">{t('common.cancel')}</button>
                <button type="submit" disabled={addBook.isPending}
                  className="px-4 py-2 rounded-lg bg-[#5b63d3] hover:bg-[#4951c4] text-white text-sm font-semibold border-none cursor-pointer transition disabled:opacity-50">
                  {addBook.isPending ? `${t('common.saving')}` : t('shelves.addBook')}
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
  const {t} = useTranslation();
  return (
    <section className="bg-white rounded-xl border border-[#e8e2d9] shadow-sm p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-serif font-bold text-[#1c1714]">{shelf.name}</h3>
        {isOwn && (
          <button onClick={onAdd}
            className="text-xs px-3 py-1.5 rounded-full border border-[#5b63d3] text-[#5b63d3] bg-white hover:bg-[#5b63d3] hover:text-white cursor-pointer transition">
            + {t('shelves.addBook')}
          </button>
        )}
      </div>

      {shelf.books.length === 0 ? (
          <p className="text-sm text-[#b0a9a1]">{t('shelves.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {shelf.books.map((book: Book) => (
            <li key={book.bookId} className="flex items-center gap-3 p-3 bg-[#faf7f2] rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-[#1c1714] truncate">{book.title}</div>
                <div className="text-xs text-[#7a6f68] italic">{book.author}</div>
              </div>
              {isOwn && (
                <>
                  <select value={shelf.shelfId} onChange={(e) => onMove(book.bookId, Number(e.target.value))}
                    className="text-xs px-2 py-1 rounded-lg border border-[#e8e2d9] bg-white text-[#7a6f68] cursor-pointer focus:outline-none focus:border-[#5b63d3]">
                    {allShelves.map((s) => <option key={s.shelfId} value={s.shelfId}>{s.name}</option>)}
                  </select>
                  <button onClick={() => onDelete(book.bookId)}
                    className="text-[#b0a9a1] hover:text-red-400 bg-transparent border-none cursor-pointer text-sm transition">✕</button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
