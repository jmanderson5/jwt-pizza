import React from 'react';
import View from './view';
import { useNavigate } from 'react-router-dom';
import NotFound from './notFound';
import Button from '../components/button';
import { pizzaService } from '../service/service';
import { Franchise, FranchiseList, Role, Store, User, UserList } from '../service/pizzaService';
import { TrashIcon } from '../icons';

interface Props {
  user: User | null;
}

export default function AdminDashboard(props: Props) {
  const navigate = useNavigate();
  const [franchiseList, setFranchiseList] = React.useState<FranchiseList>({ franchises: [], more: false });
  const [franchisePage, setFranchisePage] = React.useState(0);
  const filterFranchiseRef = React.useRef<HTMLInputElement>(null);
  const [userList, setUserList] = React.useState<UserList>({
    users: [],
    more: false,
  });
  const [userPage, setUserPage] = React.useState(1);
  const [userFilter, setUserFilter] = React.useState('');
  const [userSearch, setUserSearch] = React.useState('');
  const [userError, setUserError] = React.useState('');
  const [usersLoading, setUsersLoading] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      setFranchiseList(await pizzaService.getFranchises(franchisePage, 3, '*'));
    })();
  }, [props.user, franchisePage]);

  React.useEffect(() => {
    if (!Role.isRole(props.user, Role.Admin)) {
      return;
    }

    let cancelled = false;

    async function loadUsers() {
      setUsersLoading(true);
      setUserError('');

      try {
        const result = await pizzaService.listUsers(
          userPage,
          10,
          userFilter
        );

        if (!cancelled) {
          setUserList(result);
        }
      } catch (error) {
        if (!cancelled) {
          setUserError('Failed to load users.');
        }
      } finally {
        if (!cancelled) {
          setUsersLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, [props.user, userPage, userFilter]);

  function createFranchise() {
    navigate('/admin-dashboard/create-franchise');
  }

  async function closeFranchise(franchise: Franchise) {
    navigate('/admin-dashboard/close-franchise', { state: { franchise: franchise } });
  }

  async function closeStore(franchise: Franchise, store: Store) {
    navigate('/admin-dashboard/close-store', { state: { franchise: franchise, store: store } });
  }

  async function filterFranchises() {
    setFranchiseList(await pizzaService.getFranchises(franchisePage, 10, `*${filterFranchiseRef.current?.value}*`));
  }

  let response = <NotFound />;
  if (Role.isRole(props.user, Role.Admin)) {
    response = (
      <View title="Mama Ricci's kitchen">
        <div className="text-start py-8 px-4 sm:px-6 lg:px-8">
          <h3 className="text-neutral-100 text-xl">Franchises</h3>
          <div className="bg-neutral-100 overflow-clip my-4">
            <div className="flex flex-col">
              <div className="-m-1.5 overflow-x-auto">
                <div className="p-1.5 min-w-full inline-block align-middle">
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="uppercase text-neutral-100 bg-slate-400 border-b-2 border-gray-500">
                        <tr>
                          {['Franchise', 'Franchisee', 'Store', 'Revenue', 'Action'].map((header) => (
                            <th key={header} scope="col" className="px-6 py-3 text-center text-xs font-medium">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      {franchiseList.franchises.map((franchise, findex) => {
                        return (
                          <tbody key={findex} className="divide-y divide-gray-200">
                            <tr className="border-neutral-500 border-t-2">
                              <td className="text-start px-2 whitespace-nowrap text-l font-mono text-orange-600">{franchise.name}</td>
                              <td className="text-start px-2 whitespace-nowrap text-sm font-normal text-gray-800" colSpan={3}>
                                {franchise.admins?.map((o) => o.name).join(', ')}
                              </td>
                              <td className="px-6 py-1 whitespace-nowrap text-end text-sm font-medium">
                                <button type="button" className="px-2 py-1 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-1 border-orange-400 text-orange-400  hover:border-orange-800 hover:text-orange-800" onClick={() => closeFranchise(franchise)}>
                                  <TrashIcon />
                                  Close
                                </button>
                              </td>
                            </tr>

                            {franchise.stores.map((store, sindex) => {
                              return (
                                <tr key={sindex} className="bg-neutral-100">
                                  <td className="text-end px-2 whitespace-nowrap text-sm text-gray-800" colSpan={3}>
                                    {store.name}
                                  </td>
                                  <td className="text-end px-2 whitespace-nowrap text-sm text-gray-800">{store.totalRevenue?.toLocaleString()} ₿</td>
                                  <td className="px-6 py-1 whitespace-nowrap text-end text-sm font-medium">
                                    <button type="button" className="px-2 py-1 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-1 border-orange-400 text-orange-400 hover:border-orange-800 hover:text-orange-800" onClick={() => closeStore(franchise, store)}>
                                      <TrashIcon />
                                      Close
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        );
                      })}
                      <tfoot>
                        <tr>
                          <td className="px-1 py-1">
                            <input type="text" ref={filterFranchiseRef} name="filterFranchise" placeholder="Filter franchises" className="px-2 py-1 text-sm border border-gray-300 rounded-lg" />
                            <button type="submit" className="ml-2 px-2 py-1 text-sm font-semibold rounded-lg border border-orange-400 text-orange-400 hover:border-orange-800 hover:text-orange-800" onClick={filterFranchises}>
                              Submit
                            </button>
                          </td>
                          <td colSpan={4} className="text-end text-sm font-medium">
                            <button className="w-12 p-1 text-sm font-semibold rounded-lg border border-transparent bg-white text-grey border-grey m-1 hover:bg-orange-200 disabled:bg-neutral-300 " onClick={() => setFranchisePage(franchisePage - 1)} disabled={franchisePage <= 0}>
                              «
                            </button>
                            <button className="w-12 p-1 text-sm font-semibold rounded-lg border border-transparent bg-white text-grey border-grey m-1 hover:bg-orange-200 disabled:bg-neutral-300" onClick={() => setFranchisePage(franchisePage + 1)} disabled={!franchiseList.more}>
                              »
                            </button>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <Button className="w-36 text-xs sm:text-sm sm:w-64" title="Add Franchise" onPress={createFranchise} />
        </div>

        {/* User Management */}
        <section className="text-start py-8 px-4 sm:px-6 lg:px-8">
          <h3 className="text-neutral-100 text-xl font-semibold mb-4">
            Users
          </h3>

          {/* Name filter */}
          <form
            className="flex gap-3 mb-4"
            onSubmit={(event) => {
              event.preventDefault();
              setUserPage(1);
              setUserFilter(userSearch.trim());
            }}
          >
            <input
              type="text"
              aria-label="Filter users by name"
              placeholder="Filter users by name"
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
            />

            <button
              type="submit"
              className="rounded-lg bg-orange-500 px-5 py-2 font-semibold text-white hover:bg-orange-600"
            >
              Search
            </button>
          </form>

          {userError && (
            <p role="alert" className="text-red-400 mb-4">
              {userError}
            </p>
          )}

          <div className="bg-white rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-slate-400 text-white">
                <tr>
                  {['Name', 'Email', 'Role', 'Action'].map((header) => (
                    <th
                      key={header}
                      scope="col"
                      className="px-5 py-3 text-left text-sm font-semibold"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {userList.users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-800">
                      {user.name}
                    </td>

                    <td className="px-5 py-3 text-gray-800">
                      {user.email}
                    </td>

                    <td className="px-5 py-3 text-gray-800">
                      {user.roles?.map((r) => r.role).join(', ')}
                    </td>

                    <td className="px-5 py-3">
                      <button
                        type="button"
                        disabled
                        className="rounded-lg border border-orange-400 px-3 py-1 text-orange-600 disabled:opacity-50"
                        title="Delete will be implemented in Step 4"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!usersLoading && userList.users.length === 0 && (
              <p className="p-5 text-center text-gray-500">
                No users found.
              </p>
            )}

            {usersLoading && (
              <p className="p-5 text-center text-gray-500">
                Loading users...
              </p>
            )}
          </div>

          {/* Pagination */}
          <div className="flex justify-end items-center gap-3 mt-4">
            <button
              type="button"
              disabled={userPage <= 1 || usersLoading}
              onClick={() => setUserPage((page) => page - 1)}
              className="rounded-lg bg-white px-4 py-2 text-gray-800 disabled:opacity-50"
            >
              Previous
            </button>

            <span className="text-white">
              Page {userPage}
            </span>

            <button
              type="button"
              disabled={!userList.more || usersLoading}
              onClick={() => setUserPage((page) => page + 1)}
              className="rounded-lg bg-white px-4 py-2 text-gray-800 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </section>
      </View>
    );
  }

  return response;
}
