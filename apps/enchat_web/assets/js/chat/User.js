import { Presence } from 'phoenix';

export class User {
  getLatestOnlineAt(metas) {
    const earliestDate =
        metas
          .sort((a, b) => Date(a.online_at) - Date(b.online_at))
          .shift()
          .online_at;
        
    return new Date(earliestDate);
  }
    
  getUsers(presences) {
    return (
      Presence.list(
        presences,
        (name, { metas: [first, ...rest] }) => ({
          name,
          sessions: rest.length + 1,
          joined: this.getLatestOnlineAt([first, ...rest]),
        })
      )
    );
  }
}
