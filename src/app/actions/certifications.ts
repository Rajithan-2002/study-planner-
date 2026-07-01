'use server'

import { createClient, getCurrentUserId, logActivity } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCertification(formData: FormData) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const name = formData.get('name') as string
    const domainId = formData.get('domain_id') as string | null
    const provider = formData.get('provider') as string | null
    const cost = formData.get('cost') ? Number(formData.get('cost')) : 0
    const priority = formData.get('priority') as string || 'LOW'
    const targetDate = formData.get('target_date') as string | null
    const examDate = formData.get('exam_date') as string | null
    const status = formData.get('status') as string || 'IDEA'
    const notes = formData.get('notes') as string | null
    const dailyStudyMinutes = formData.get('daily_study_minutes') ? Number(formData.get('daily_study_minutes')) : 30
    const weeklyStudyGoalHours = formData.get('weekly_study_goal_hours') ? Number(formData.get('weekly_study_goal_hours')) : 3
    const estimatedTotalHours = formData.get('estimated_total_hours') ? Number(formData.get('estimated_total_hours')) : 0
    const difficulty = formData.get('difficulty') as string || 'MEDIUM'
    const flexibleSchedule = formData.get('flexible_schedule') !== 'false'
    const targetExamDate = formData.get('target_exam_date') as string | null
    const goalId = formData.get('goal_id') as string | null

    if (!name) {
      return { success: false, error: 'Certification name is required' }
    }

    const { data: cert, error: certError } = await supabase.from('certifications').insert({
      user_id: userId,
      name,
      domain_id: domainId || null,
      priority,
      provider,
      cost,
      target_date: targetDate || null,
      exam_date: examDate || null,
      status,
      notes,
      daily_study_minutes: dailyStudyMinutes,
      weekly_study_goal_hours: weeklyStudyGoalHours,
      estimated_total_hours: estimatedTotalHours,
      difficulty,
      flexible_schedule: flexibleSchedule,
      target_exam_date: targetExamDate || examDate || null,
      goal_id: goalId || null,
      is_archived: false
    }).select().single()

    if (certError) {
      console.error('Error creating certification:', certError)
      return { success: false, error: certError.message || 'Failed to create certification' }
    }

    await logActivity('CREATE_CERTIFICATION', 'CERTIFICATION', cert.id)

    // Create Calendar Event if Exam Date is set
    if (examDate) {
      await supabase.from('life_events').insert({
        user_id: userId,
        title: `${name} Certification Exam`,
        type: 'CERT_EXAM',
        event_date: examDate,
        importance: priority === 'CRITICAL' ? 100 : priority === 'HIGH' ? 75 : priority === 'MEDIUM' ? 50 : 25,
        related_entity_id: cert.id
      })
    }

    revalidatePath('/certifications')
    revalidatePath('/')
    return { success: true, data: cert }
  } catch (err: any) {
    console.error('createCertification exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function updateCertification(formData: FormData) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const certId = formData.get('cert_id') as string
    const name = formData.get('name') as string
    const domainId = formData.get('domain_id') as string | null
    const provider = formData.get('provider') as string | null
    const cost = formData.get('cost') ? Number(formData.get('cost')) : 0
    const priority = formData.get('priority') as string || 'LOW'
    const targetDate = formData.get('target_date') as string | null
    const examDate = formData.get('exam_date') as string | null
    const status = formData.get('status') as string || 'ACTIVE'
    const notes = formData.get('notes') as string | null
    const dailyStudyMinutes = formData.get('daily_study_minutes') ? Number(formData.get('daily_study_minutes')) : 30
    const weeklyStudyGoalHours = formData.get('weekly_study_goal_hours') ? Number(formData.get('weekly_study_goal_hours')) : 3
    const estimatedTotalHours = formData.get('estimated_total_hours') ? Number(formData.get('estimated_total_hours')) : 0
    const difficulty = formData.get('difficulty') as string || 'MEDIUM'
    const flexibleSchedule = formData.get('flexible_schedule') !== 'false'
    const targetExamDate = formData.get('target_exam_date') as string | null
    const goalId = formData.get('goal_id') as string | null

    if (!certId || !name) {
      return { success: false, error: 'Certification ID and name are required' }
    }

    const updatePayload: any = {
      name,
      domain_id: domainId || null,
      provider: provider || null,
      cost,
      priority,
      status,
      target_date: targetDate || null,
      exam_date: examDate || null,
      notes: notes || null,
      daily_study_minutes: dailyStudyMinutes,
      weekly_study_goal_hours: weeklyStudyGoalHours,
      estimated_total_hours: estimatedTotalHours,
      difficulty,
      flexible_schedule: flexibleSchedule,
      target_exam_date: targetExamDate || examDate || null,
      goal_id: goalId || null,
      updated_at: new Date().toISOString()
    }

    if (status === 'COMPLETED') {
      updatePayload.completed_at = new Date().toISOString()
    }

    const { data: cert, error: certError } = await supabase
      .from('certifications')
      .update(updatePayload)
      .eq('id', certId)
      .eq('user_id', userId)
      .select()
      .single()

    if (certError) {
      console.error('Error updating certification:', certError)
      return { success: false, error: certError.message || 'Failed to update certification' }
    }

    await logActivity('UPDATE_CERTIFICATION', 'CERTIFICATION', cert.id)

    // Sync exam calendar event
    await supabase.from('life_events').delete().eq('user_id', userId).eq('related_entity_id', certId)
    if (examDate) {
      await supabase.from('life_events').insert({
        user_id: userId,
        title: `${name} Certification Exam`,
        type: 'CERT_EXAM',
        event_date: examDate,
        importance: priority === 'CRITICAL' ? 100 : priority === 'HIGH' ? 75 : priority === 'MEDIUM' ? 50 : 25,
        related_entity_id: certId
      })
    }

    revalidatePath('/certifications')
    revalidatePath('/')
    return { success: true, data: cert }
  } catch (err: any) {
    console.error('updateCertification exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function archiveCertification(id: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { data, error } = await supabase
      .from('certifications')
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error archiving certification:', error)
      return { success: false, error: error.message || 'Failed to archive certification' }
    }

    await logActivity('ARCHIVE_CERTIFICATION', 'CERTIFICATION', id)

    revalidatePath('/certifications')
    revalidatePath('/')
    return { success: true, data }
  } catch (err: any) {
    console.error('archiveCertification exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function restoreCertification(id: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { data, error } = await supabase
      .from('certifications')
      .update({ is_archived: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error restoring certification:', error)
      return { success: false, error: error.message || 'Failed to restore certification' }
    }

    await logActivity('RESTORE_CERTIFICATION', 'CERTIFICATION', id)

    revalidatePath('/certifications')
    revalidatePath('/')
    return { success: true, data }
  } catch (err: any) {
    console.error('restoreCertification exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function deleteCertification(id: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()
    
    // Cascade cleanups
    await supabase.from('tasks').delete().eq('user_id', userId).eq('related_entity_type', 'CERTIFICATION').eq('related_entity_id', id)
    await supabase.from('life_events').delete().eq('user_id', userId).eq('related_entity_id', id)

    const { error } = await supabase.from('certifications').delete().eq('id', id).eq('user_id', userId)

    if (error) {
      console.error('Error deleting certification:', error)
      return { success: false, error: error.message || 'Failed to delete certification' }
    }

    revalidatePath('/certifications')
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    console.error('deleteCertification exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function createCertificationDirect(
  name: string, 
  provider?: string, 
  estimatedTotalHours?: number, 
  targetExamDate?: string, 
  priority?: string, 
  difficulty?: string, 
  goalId?: string
) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    if (!name) {
      return { success: false, error: 'Certification name is required' }
    }

    const { data, error } = await supabase.from('certifications').insert({
      user_id: userId,
      name,
      provider: provider || null,
      status: 'IDEA',
      priority: priority || 'MEDIUM',
      estimated_total_hours: estimatedTotalHours || 0,
      difficulty: difficulty || 'MEDIUM',
      flexible_schedule: true,
      target_exam_date: targetExamDate || null,
      goal_id: goalId || null,
      is_archived: false
    }).select().single()

    if (error) {
      console.error('Error creating certification direct:', error)
      return { success: false, error: error.message || 'Failed to create certification' }
    }

    await logActivity('CREATE_CERTIFICATION', 'CERTIFICATION', data.id)

    revalidatePath('/certifications')
    revalidatePath('/')
    return { success: true, data }
  } catch (err: any) {
    console.error('createCertificationDirect exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function createCertFromTemplate(templateType: string, customName?: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    let name = customName || 'Certification Program'
    let provider = 'AWS'
    let dailyStudy = 45
    let weeklyStudy = 4
    let blueprintDomains: Array<{ domain: string; title: string; estHours: number; difficulty: string }> = []

    switch (templateType) {
      case 'AWS_SAA':
        name = customName || 'AWS Certified Solutions Architect – Associate (SAA-C03)'
        provider = 'Amazon Web Services'
        dailyStudy = 45
        weeklyStudy = 4
        blueprintDomains = [
          { domain: 'Domain 1: Design Resilient Architectures', title: 'Design highly available and fault-tolerant architectures', estHours: 15, difficulty: 'MEDIUM' },
          { domain: 'Domain 2: Design High-Performing Architectures', title: 'Determine high-performing storage, compute, and database solutions', estHours: 12, difficulty: 'MEDIUM' },
          { domain: 'Domain 3: Design Secure Applications and Architectures', title: 'Design secure access, network infrastructure, and data encryption', estHours: 18, difficulty: 'HARD' },
          { domain: 'Domain 4: Design Cost-Optimized Architectures', title: 'Identify cost-effective storage, database, and network designs', estHours: 10, difficulty: 'EASY' }
        ]
        break
      case 'CCNA':
        name = customName || 'Cisco Certified Network Associate (200-301 CCNA)'
        provider = 'Cisco'
        dailyStudy = 60
        weeklyStudy = 6
        blueprintDomains = [
          { domain: 'Domain 1: Network Fundamentals', title: 'Routers, switches, cabling, IPv4/IPv6 addressing', estHours: 14, difficulty: 'EASY' },
          { domain: 'Domain 2: Network Access', title: 'VLANs, trunking, EtherChannel, and wireless architectures', estHours: 16, difficulty: 'MEDIUM' },
          { domain: 'Domain 3: IP Connectivity', title: 'Routing protocols, OSPFv2, static routing', estHours: 20, difficulty: 'HARD' },
          { domain: 'Domain 4: IP Services', title: 'DHCP, NAT, NTP, SNMP, QoS', estHours: 12, difficulty: 'MEDIUM' },
          { domain: 'Domain 5: Security Fundamentals', title: 'Firewalls, ACLs, site-to-site VPNs, device hardening', estHours: 15, difficulty: 'MEDIUM' },
          { domain: 'Domain 6: Automation and Programmability', title: 'REST APIs, JSON, Puppet, Chef, Ansible', estHours: 8, difficulty: 'EASY' }
        ]
        break
      case 'AZ_104':
        name = customName || 'Microsoft Certified: Azure Administrator Associate (AZ-104)'
        provider = 'Microsoft'
        dailyStudy = 45
        weeklyStudy = 4
        blueprintDomains = [
          { domain: 'Domain 1: Manage Azure Identities and Governance', title: 'Azure AD, Role-based Access Control (RBAC), Subscriptions', estHours: 10, difficulty: 'EASY' },
          { domain: 'Domain 2: Implement and Manage Storage', title: 'Azure Storage accounts, blobs, files, sync tools', estHours: 12, difficulty: 'MEDIUM' },
          { domain: 'Domain 3: Deploy and Manage Compute Resources', title: 'Virtual Machines (VMs), containers, Azure App Services', estHours: 18, difficulty: 'HARD' },
          { domain: 'Domain 4: Configure and Manage Virtual Networking', title: 'VNets, peering, DNS, Azure VPN Gateway, ExpressRoute', estHours: 22, difficulty: 'HARD' },
          { domain: 'Domain 5: Monitor and Back Up Azure Resources', title: 'Azure Monitor, Log Analytics, Azure Backup & Recovery', estHours: 10, difficulty: 'EASY' }
        ]
        break
      default:
        name = customName || 'Generic Professional Certification'
        provider = 'Other'
        dailyStudy = 30
        weeklyStudy = 3
        blueprintDomains = [
          { domain: 'Core Concepts', title: 'Introductory fundamentals and vocabulary', estHours: 8, difficulty: 'EASY' },
          { domain: 'Practical Application', title: 'Hands-on practice lab exercises', estHours: 15, difficulty: 'MEDIUM' },
          { domain: 'Exam Review', title: 'Spaced repetition revision and practice exam tests', estHours: 10, difficulty: 'HARD' }
        ]
        break
    }

    const { data: cert, error: certErr } = await supabase.from('certifications').insert({
      user_id: userId,
      name,
      provider,
      status: 'ACTIVE',
      priority: 'MEDIUM',
      daily_study_minutes: dailyStudy,
      weekly_study_goal_hours: weeklyStudy,
      is_archived: false
    }).select().single()

    if (certErr || !cert) {
      return { success: false, error: certErr?.message || 'Failed to create certification from template' }
    }

    // Insert Default blueprint topics
    if (blueprintDomains.length > 0) {
      const topicPayloads = blueprintDomains.map((d, idx) => ({
        certification_id: cert.id,
        domain_name: d.domain,
        title: d.title,
        estimated_study_hours: d.estHours,
        difficulty: d.difficulty,
        learning_status: 'NOT_STARTED',
        priority: 'MEDIUM',
        order_index: idx + 1
      }))

      const { data: insertedTopics } = await supabase.from('certification_topics').insert(topicPayloads).select()

      // Create dummy subtopics for the first topic of the blueprint to showcase structured hierarchy
      if (insertedTopics && insertedTopics.length > 0) {
        const subtopicPayloads = [
          { topic_id: insertedTopics[0].id, title: 'Read official exam guide section', order_index: 1 },
          { topic_id: insertedTopics[0].id, title: 'Complete first practice lab workbook', order_index: 2 },
          { topic_id: insertedTopics[0].id, title: 'Draft summary revision notebook', order_index: 3 }
        ]
        await supabase.from('certification_subtopics').insert(subtopicPayloads)
      }
    }

    await logActivity('CREATE_CERTIFICATION_TEMPLATE', 'CERTIFICATION', cert.id)

    revalidatePath('/certifications')
    revalidatePath('/')
    return { success: true, data: cert }
  } catch (err: any) {
    console.error('createCertFromTemplate exception:', err)
    return { success: false, error: err.message || 'Server error occurred' }
  }
}
