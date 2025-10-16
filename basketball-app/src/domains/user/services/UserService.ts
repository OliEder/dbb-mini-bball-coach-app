/**
 * UserService - Verwaltung des Trainer-Accounts
 */

import { db } from '../../../shared/db/database';
import type { User } from '../../../shared/types';

export class UserService {
  /**
   * Erstellt einen neuen User
   */
  async createUser(data: {
    vorname: string;
    nachname: string;
    email?: string;
  }): Promise<User> {
    const user: User = {
      user_id: crypto.randomUUID(),
      vorname: data.vorname,
      nachname: data.nachname,
      name: `${data.vorname} ${data.nachname}`,
      email: data.email,
      created_at: new Date(),
    };

    await db.users.add(user);
    return user;
  }

  /**
   * Holt den aktuellen User (sollte nur einer existieren)
   */
  async getCurrentUser(): Promise<User | undefined> {
    const users = await db.users.toArray();
    return users[0]; // Erster User
  }

  /**
   * Pr\u00fcft ob ein User existiert
   */
  async userExists(): Promise<boolean> {
    const count = await db.users.count();
    return count > 0;
  }

  /**
   * Updated User-Daten
   */
  async updateUser(userId: string, data: Partial<User>): Promise<void> {
    await db.users.update(userId, {
      ...data,
      updated_at: new Date()
    });
  }

  /**
   * L\u00f6scht einen User (mit allen Teams!)
   */
  async deleteUser(userId: string): Promise<void> {
    // Warnung: L\u00f6scht auch alle Teams des Users!
    const teams = await db.teams.where('user_id').equals(userId).toArray();
    
    for (const team of teams) {
      // Teams auf 'gegner' setzen statt l\u00f6schen
      await db.teams.update(team.team_id, {
        team_typ: 'gegner',
        user_id: undefined
      });
    }

    await db.users.delete(userId);
  }
}

export const userService = new UserService();
