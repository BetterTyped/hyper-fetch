export type UserModel = {
  id: number;
  name: string;
  email: string;
  age: number;
  admin?: boolean;
  permissions: string[];
  nestedValue: any;
};

export type PostUserModel = {
  name: string;
  email: string;
  age: number;
};
