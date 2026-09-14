export type UserEditFormValues = {
  name: string
  contactNumber: string
  bio: string
  emailVerified: boolean
  phoneVerified: boolean
}

export type UserEditSource = {
  emailVerified?: boolean | null
  phoneVerified?: boolean | null
  profile?: {
    name?: string | null
    contactNumber?: string | null
    bio?: string | null
  } | null
}

export type AdminUpdateUserInput = {
  name?: string | null
  contactNumber?: string | null
  emailVerified?: boolean | null
  phoneVerified?: boolean | null
}

export function userToFormValues(user: UserEditSource): UserEditFormValues {
  return {
    name: user.profile?.name?.trim() ?? '',
    contactNumber: user.profile?.contactNumber?.trim() ?? '',
    bio: user.profile?.bio?.trim() ?? '',
    emailVerified: Boolean(user.emailVerified),
    phoneVerified: Boolean(user.phoneVerified),
  }
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

export function buildAdminUpdateUserInput(
  values: UserEditFormValues,
): AdminUpdateUserInput {
  return {
    name: emptyToNull(values.name),
    contactNumber: emptyToNull(values.contactNumber),
    emailVerified: values.emailVerified,
    phoneVerified: values.phoneVerified,
  }
}

export function isWorkerUser(
  user: { worker?: { id?: string | null } | null } | null | undefined,
): boolean {
  return Boolean(user?.worker?.id)
}
