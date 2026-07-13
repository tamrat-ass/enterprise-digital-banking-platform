const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./.data/app.db');

async function check() {
  return new Promise((resolve) => {
    // Get user info
    db.all("SELECT id, name, email, roleId FROM profiles WHERE name = 'Tamrat Assefa Weldemesekel'", [], (err, rows) => {
      if (err) {
        console.error('Error fetching user:', err);
        db.close();
        resolve();
        return;
      }
      
      if (!rows || rows.length === 0) {
        console.log('User not found');
        db.close();
        resolve();
        return;
      }
      
      const user = rows[0];
      console.log('User:', user);
      
      // Get role details
      db.all("SELECT id, name FROM roles WHERE id = ?", [user.roleId], (err, roles) => {
        if (err) {
          console.error('Error fetching role:', err);
          db.close();
          resolve();
          return;
        }
        
        if (roles && roles.length > 0) {
          console.log('Role:', roles[0]);
          
          // Get permissions
          db.all("SELECT permission FROM role_permissions WHERE role_id = ?", [user.roleId], (err, perms) => {
            if (err) {
              console.error('Error fetching permissions:', err);
              db.close();
              resolve();
              return;
            }
            
            console.log('Total permissions:', perms ? perms.length : 0);
            if (perms && perms.length > 0) {
              console.log('Sample permissions:');
              perms.slice(0, 15).forEach(p => console.log('  -', p.permission));
            }
            
            db.close();
            resolve();
          });
        } else {
          console.log('No role found');
          db.close();
          resolve();
        }
      });
    });
  });
}

check();
